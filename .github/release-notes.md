# Motore esterno per MindTheCheck
Questo software consente di caricare un motore di scacchi (es. l'ultima versione di Stockfish) e di utilizzarlo per analizzare le posizioni.
Può lavorare in due modalità:

- uso esterno (come motore esterno a **MindTheCheck Openings Repertoire**)
- uso locale (come interfaccia per analizzare posizioni identificate dal _FEN_)

## Caricamento dei motori
Il software consente di caricare più motori istallati nel PC e di configurarli come si desidera (per profondità, memoria, linee visualizzate,...) in base alle caratteristiche del motore scelto. La configurazione rimane salvata.

## Uso esterno
Se il software è in questa modalità, è possibile attivare lo switch "_Motore esterno_" dal menu _Altro_ e tutte le posizioni visitate in **MindTheCheck Openings Repertoire** verranno valutate dal motore esterno in luogo del motore interno (_Stockfish 15_) 

## Uso locale
In questa modalità il motore analizza le posizioni fornite nel campo _FEN_ in base alla configurazione del motore. Si tratta di una interfaccia per motori che, oltre a visualizzare la valutazione in centipawns, fornisce anche la stima delle probabilità di vittoria, patta e sconfitta (_WDL_).

## Istallazione
Scaricare il file 
```mtc-repertoire-engine-<versione> Setup.exe```
Il file non è firmato quindi Windows apre una finestra di sicurezza, nella quale occorre scegliere
