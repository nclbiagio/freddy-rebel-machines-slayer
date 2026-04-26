## TODO Engine

Crea una scena ad hoc di debug e non il componente attuale, se sei in modalità debug e clicchi sulla X della tastiera
Metti in pausa la scena e apri la schermata di debug esattamente come è adesso con tutti i dati attuali degli sprite e dei livelli

## TODO Game

Nel momento in cui spari un proiettile evil diciamo così e decidi quindi di passare al lato oscuro non puoi più assorbire la luce
Dalla piaga, quindi va inserito un flag ad hoc (marchio, èStatoMarchiato), se quel flag è a true e vuoi usare l'assorbimento non puoi farlo
Sulla base delle tue scelte aggiungere delle animazioni diverse, se assorbi e salvi, se spari e uccidi

## Info

TravelMessages are used for Novel games

## Development

In tiled if you want an array of values, use the type string and add a commma like: ms1,ms2

When you use a Dialog Scene the next must be the same scene, because of the flow is Scene1 -> Dialogue -> Scene1

## Game

Puoi scegliere se salvare le piaghe e riportarle a uomini o ucciderle e acquistare potere
Salvare le piaghe ti da ricompense umane, come bottigliette della salute, posizioni della velocità, insomma cose usa e getta
Uccidere le piaghe ti darà invece poteri permanenti sull'arma, tipo sparare proiettili, lanciare altre magie di sangue ecc.
Scegli il tuo destino

Crea un sistema di ricompense ogni volta che salvi o uccidi una piaga

## Story Telling

Chapter0 spiegazione del passato, come siamo arrivati fino a quel momento, quindi stregone malvagio. piaghe, eroe chiamato a salvare il mondo o a distruggerlo

SafePoint una strana forza ti chiama verso un villaggio, una donna ti attende, ti dice che sei l'eroe che stava cercando e ti dona la torcia del destino, ti dice che puoi usarla
per assorbire la luce e salvare gli uomini intrappolati nelle piaghe o usare il potere del male per ditruggerle, a te la scelta

Chapter1 primo livello per capire i comandi, fly messages con istruzioni mentre il gico è in pausa, istruzioni come attaccare e spiegazione barra della malvagità
"Questa barra rappresenta la <strong>corruzione</strong> che si accumula quando compi azioni oscure.
Se raggiunge il 100%, potresti <em>perdere il controllo del tuo personaggio</em>."
