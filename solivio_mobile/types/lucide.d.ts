// lucide-react-native utilise SvgProps de react-native-svg qui expose stroke, pas color.
// On augmente LucideProps pour accepter color comme alias de stroke.
// export {} est requis pour que ce fichier soit un module et non un script global :
// sans cela, declare module serait une declaration ambiante qui remplacerait
// les types du package au lieu de les augmenter.
export {};

declare module 'lucide-react-native' {
  interface LucideProps {
    color?: string;
  }
}
