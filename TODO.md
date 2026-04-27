# TODO

*NOTE: rx désigne la librairie reflex.*

## Forms

1. Pour les str, Enum dont les valeurs sont en français. il faut créer une fonction factory qui puisse générer un widget pour le choix avec les itérables de l'Enum. Par défaut une liste qui utilise `rx.select`.

2. Pour les tables suivantes, générer une page et un formulaire. Pour cela utiliser les conseils de la page [code structure](https://reflex.dev/docs/advanced-onboarding/code-structure/) :
   * SpellTable
   * DicePoolTable
   * ScenarioTable
   * Campaign
Ces tables sont profondes, elles possèdent des relations 1-n et n-n. Mettre en place les bons widgets pour mettre en forme et rendre l'UI/UX claire [Laws of UX](https://lawsofux.com/). Notamment, il faut garder à l'esprit pour une relation 1-n qu'on veut soit créer une nouvelle entrée de la table liée, soit en prendre une existente.
Pour chaque représentation de table, attend ma validation.

3. Les tables à mettre en place ensuite sont :
   * CareerTable
   * PlayableCharacterTable
   * NonPlayableCharacterTable
Les conseils sont identiques que pour le point 2.
   