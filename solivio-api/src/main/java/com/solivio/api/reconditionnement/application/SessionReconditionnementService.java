package com.solivio.api.reconditionnement.application;

import com.solivio.api.distribution.domain.Lieu;
import com.solivio.api.distribution.infrastructure.web.dto.LieuRequest;
import com.solivio.api.distribution.infrastructure.web.dto.LieuResponse;
import com.solivio.api.reconditionnement.domain.InscriptionReconditionnement;
import com.solivio.api.reconditionnement.domain.SessionReconditionnement;
import com.solivio.api.reconditionnement.domain.StatutPresenceReconditionnement;
import com.solivio.api.reconditionnement.domain.StatutSessionReconditionnement;
import com.solivio.api.reconditionnement.infrastructure.kafka.ReconditionnementEventPublisher;
import com.solivio.api.reconditionnement.infrastructure.persistence.InscriptionReconditionnementRepository;
import com.solivio.api.reconditionnement.infrastructure.persistence.SessionReconditionnementRepository;
import com.solivio.api.reconditionnement.infrastructure.web.dto.AnnulerSessionRequest;
import com.solivio.api.reconditionnement.infrastructure.web.dto.CreateSessionReconditionnementRequest;
import com.solivio.api.reconditionnement.infrastructure.web.dto.InscriptionReconditionnementResponse;
import com.solivio.api.reconditionnement.infrastructure.web.dto.PointageReconditionnementRequest;
import com.solivio.api.reconditionnement.infrastructure.web.dto.SessionReconditionnementResponse;
import com.solivio.api.shared.exception.ConflictException;
import com.solivio.api.shared.exception.NotFoundException;
import com.solivio.api.shared.identity.PersonneQueryPort;
import com.solivio.api.shared.identity.PersonneQueryPort.PersonneContactInfo;
import com.solivio.api.shared.identity.PersonneQueryPort.PersonneInfo;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class SessionReconditionnementService {

    private final SessionReconditionnementRepository sessionRepository;
    private final InscriptionReconditionnementRepository inscriptionRepository;
    private final ReconditionnementEventPublisher eventPublisher;
    private final PersonneQueryPort personneQueryPort;

    public SessionReconditionnementService(
        SessionReconditionnementRepository sessionRepository,
        InscriptionReconditionnementRepository inscriptionRepository,
        ReconditionnementEventPublisher eventPublisher,
        PersonneQueryPort personneQueryPort
    ) {
        this.sessionRepository = sessionRepository;
        this.inscriptionRepository = inscriptionRepository;
        this.eventPublisher = eventPublisher;
        this.personneQueryPort = personneQueryPort;
    }

    public SessionReconditionnementResponse creer(
        CreateSessionReconditionnementRequest request, String emailCreateur
    ) {
        if (!request.dateHeureFin().isAfter(request.dateHeureDebut())) {
            throw new IllegalArgumentException(
                "date_heure_fin doit etre apres date_heure_debut"
            );
        }
        PersonneInfo createur = personneQueryPort.trouverPersonne(emailCreateur);
        SessionReconditionnement session = new SessionReconditionnement(
            request.titre(),
            request.description(),
            toLieu(request.lieu()),
            request.dateHeureDebut(),
            request.dateHeureFin(),
            request.capacite(),
            createur.id()
        );
        sessionRepository.save(session);
        return toResponse(session, 0);
    }

    public SessionReconditionnementResponse publier(UUID sessionId, String tenantSlug) {
        SessionReconditionnement session = trouverOuEchouer(sessionId);
        session.transitionnerVers(StatutSessionReconditionnement.PUBLIEE, null);
        sessionRepository.save(session);
        eventPublisher.publierPubliee(sessionId, tenantSlug, session.getDateHeureDebut());
        return toResponse(session, compterInscrits(sessionId));
    }

    public SessionReconditionnementResponse demarrer(UUID sessionId) {
        SessionReconditionnement session = trouverOuEchouer(sessionId);
        session.transitionnerVers(StatutSessionReconditionnement.EN_COURS, null);
        return toResponse(sessionRepository.save(session), compterInscrits(sessionId));
    }

    public SessionReconditionnementResponse terminer(UUID sessionId) {
        SessionReconditionnement session = trouverOuEchouer(sessionId);
        session.transitionnerVers(StatutSessionReconditionnement.TERMINEE, null);
        return toResponse(sessionRepository.save(session), compterInscrits(sessionId));
    }

    public SessionReconditionnementResponse annuler(
        UUID sessionId, AnnulerSessionRequest request, String tenantSlug
    ) {
        SessionReconditionnement session = trouverOuEchouer(sessionId);
        session.transitionnerVers(StatutSessionReconditionnement.ANNULEE, request.motif());
        sessionRepository.save(session);
        eventPublisher.publierAnnulee(sessionId, tenantSlug, session.getDateHeureDebut());
        return toResponse(session, compterInscrits(sessionId));
    }

    @Transactional(readOnly = true)
    public List<SessionReconditionnementResponse> lister() {
        return sessionRepository.findAllByOrderByDateHeureDebutDesc().stream()
            .map(s -> toResponse(s, compterInscrits(s.getId())))
            .toList();
    }

    @Transactional(readOnly = true)
    public List<SessionReconditionnementResponse> listerPubliees() {
        return sessionRepository.findByStatutOrderByDateHeureDebutDesc(
            StatutSessionReconditionnement.PUBLIEE).stream()
            .map(s -> toResponse(s, compterInscrits(s.getId())))
            .toList();
    }

    @Transactional(readOnly = true)
    public SessionReconditionnementResponse detail(UUID sessionId) {
        SessionReconditionnement session = trouverOuEchouer(sessionId);
        return toResponse(session, compterInscrits(sessionId));
    }

    public InscriptionReconditionnementResponse inscrire(UUID sessionId, String emailPersonne) {
        SessionReconditionnement session = trouverOuEchouer(sessionId);
        if (session.getStatut() != StatutSessionReconditionnement.PUBLIEE) {
            throw new ConflictException("Inscription impossible : la session n'est pas publiee");
        }
        if (session.getCapacite() != null
            && compterInscrits(sessionId) >= session.getCapacite()) {
            throw new ConflictException("Inscription impossible : la capacite maximale est atteinte");
        }
        PersonneInfo personne = personneQueryPort.trouverPersonne(emailPersonne);
        inscriptionRepository.findBySessionIdAndPersonneId(sessionId, personne.id())
            .ifPresent(i -> {
                if (i.estConfirmee()) {
                    throw new ConflictException("Vous etes deja inscrit(e) a cette session");
                }
            });
        InscriptionReconditionnement inscription = inscriptionRepository.findBySessionIdAndPersonneId(
            sessionId, personne.id())
            .map(i -> {
                i.setStatut("CONFIRMEE");
                return i;
            })
            .orElse(new InscriptionReconditionnement(sessionId, personne.id()));
        inscriptionRepository.save(inscription);
        return toInscriptionResponse(inscription, personne.nom() + " " + personne.prenom());
    }

    public void desinscrire(UUID sessionId, String emailPersonne) {
        SessionReconditionnement session = trouverOuEchouer(sessionId);
        if (session.getStatut() == StatutSessionReconditionnement.EN_COURS
            || session.getStatut() == StatutSessionReconditionnement.TERMINEE
            || session.getStatut() == StatutSessionReconditionnement.ANNULEE) {
            throw new ConflictException("Desinscription impossible a ce stade de la session");
        }
        PersonneInfo personne = personneQueryPort.trouverPersonne(emailPersonne);
        InscriptionReconditionnement inscription = inscriptionRepository
            .findBySessionIdAndPersonneId(sessionId, personne.id())
            .orElseThrow(() -> new NotFoundException("Inscription introuvable"));
        inscription.annuler();
        inscriptionRepository.save(inscription);
    }

    @Transactional(readOnly = true)
    public List<InscriptionReconditionnementResponse> listerInscrits(UUID sessionId) {
        trouverOuEchouer(sessionId);
        return inscriptionRepository.findBySessionId(sessionId).stream()
            .filter(InscriptionReconditionnement::estConfirmee)
            .map(i -> {
                PersonneContactInfo personne = personneQueryPort.trouverPersonneParId(i.getPersonneId());
                return toInscriptionResponse(i, personne.nom() + " " + personne.prenom());
            })
            .toList();
    }

    public InscriptionReconditionnementResponse pointer(
        UUID sessionId, PointageReconditionnementRequest request
    ) {
        SessionReconditionnement session = trouverOuEchouer(sessionId);
        if (session.getStatut() != StatutSessionReconditionnement.EN_COURS
            && session.getStatut() != StatutSessionReconditionnement.TERMINEE) {
            throw new ConflictException("Pointage impossible : la session doit etre en cours ou terminee");
        }
        StatutPresenceReconditionnement presence;
        try {
            presence = StatutPresenceReconditionnement.valueOf(request.presence().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Valeur de presence invalide : " + request.presence());
        }
        InscriptionReconditionnement inscription = inscriptionRepository
            .findBySessionIdAndPersonneId(sessionId, request.personneId())
            .orElseThrow(() -> new NotFoundException(
                "Inscription introuvable pour cette personne dans cette session"));
        inscription.pointer(presence);
        inscriptionRepository.save(inscription);
        PersonneContactInfo personne = personneQueryPort.trouverPersonneParId(request.personneId());
        return toInscriptionResponse(inscription, personne.nom() + " " + personne.prenom());
    }

    SessionReconditionnement trouverOuEchouer(UUID sessionId) {
        return sessionRepository.findById(sessionId)
            .orElseThrow(() -> new NotFoundException("Session de reconditionnement introuvable : " + sessionId));
    }

    private long compterInscrits(UUID sessionId) {
        return inscriptionRepository.countBySessionIdAndStatut(sessionId, "CONFIRMEE");
    }

    static SessionReconditionnementResponse toResponse(SessionReconditionnement s, long nbInscrits) {
        return new SessionReconditionnementResponse(
            s.getId(),
            s.getTitre(),
            s.getDescription(),
            toLieuResponse(s.getLieu()),
            s.getDateHeureDebut(),
            s.getDateHeureFin(),
            s.getCapacite(),
            s.getStatut().name(),
            s.getMotifAnnulation(),
            (int) nbInscrits,
            s.getDateCreation()
        );
    }

    private static InscriptionReconditionnementResponse toInscriptionResponse(
        InscriptionReconditionnement i, String nomComplet
    ) {
        return new InscriptionReconditionnementResponse(
            i.getId(),
            i.getSessionId(),
            i.getPersonneId(),
            nomComplet,
            i.getStatut(),
            i.getPresence().name(),
            i.getDateInscription()
        );
    }

    private static Lieu toLieu(LieuRequest r) {
        if (r == null) {
            return null;
        }
        return new Lieu(r.placeId(), r.nom(), r.adresseFormatee(), r.latitude(), r.longitude(),
            r.numeroRue(), r.voie(), r.codePostal(), r.ville());
    }

    private static LieuResponse toLieuResponse(Lieu l) {
        if (l == null) {
            return null;
        }
        return new LieuResponse(l.getPlaceId(), l.getNom(), l.getAdresseFormatee(),
            l.getLatitude(), l.getLongitude(), l.getNumeroRue(), l.getVoie(),
            l.getCodePostal(), l.getVille());
    }
}
