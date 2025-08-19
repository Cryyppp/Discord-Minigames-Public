# Discord Minigames Bot

Bot pubblico di minigiochi per Discord buildato con discord.js. Fornisce un sistema di coin, comandi sociali e minigiochi, insieme a funzionalità per owner (annunci, gestione coin).

## Caratteristiche
- Registrazione utente (/register) con 100 coin iniziali
- Bonus giornaliero (/dailybonus) — 100 coin, una volta ogni 24 ore
- Classifica coin (/baltop)
- Comandi owner: /announce (invia annunci), /addcoins (aggiungi coin)
- Statistiche dinamiche nello status del bot (server, utenti, ecc.)
- Persistenza con SQLite (./database/coins.sqlite)

## Requisiti
- Node.js 18+ (consigliato)
- npm
- Permessi bot: scope bot + applications.commands; permessi per inviare messaggi nei canali target

## Installazione
1. Clona il repository
2. Entra nella cartella del progetto
   ```bash

   ```
3. Installa dipendenze
   ```bash
   npm install
   ```

## Configurazione
Crea un file `config.json` nella root con i valori corretti:

```json
{
  "token": "BOT_TOKEN_HERE",
  "clientId": "CLIENT_ID_HERE",
  "ownerId": "TUO_USER_ID"
}
```

Assicurati che il bot sia invitato con gli scope `bot` e `applications.commands`.

## Registrazione dei comandi slash
Dopo aver aggiunto o modificato comandi esegui lo script per registrare i comandi a livello globale:

```bash
node deploycommands.js
```

Nota: i comandi globali possono impiegare alcuni minuti per propagarsi. Per testare subito usa la registrazione per singolo guild (se implementata).

## Avvio del bot
Avvia il bot con:
```bash
node index.js
```
Oppure configura uno script npm:
```json
"scripts": {
  "start": "node index.js"
}
```
e poi:
```bash
npm start
```

## Database
Il progetto usa SQLite (file: `./database/coins.sqlite`). Il modello viene sincronizzato all'avvio; controlla `database/coinsModel.js` per modifiche centralizzate al modello.

## Uso rapido dei comandi principali
- /register <username> — registra l'utente e assegna 100 coin
- /dailybonus — ritira 100 coin (cooldown 24h)
- /baltop [limit] — mostra la classifica coin
- /announce — owner only: apre modal per inviare annunci (in DM o canali di sistema, a seconda dell'implementazione)
- /addcoins — owner only: aggiunge coin a un utente

## Best practices e permessi
- Il bot deve avere permessi per inviare messaggi nei canali dove invia annunci.
- Per inviare messaggi ai proprietari dei server può essere necessario che i proprietari accettino DM da membri del server.
- Se i comandi non appaiono: eseguire `node deploycommands.js`, assicurarsi che `clientId` e `token` siano corretti e attendere la propagazione.

## Contribuire
Pull request benvenute. Seguire queste linee:
- Mantieni Coerenza nei modelli DB (usa `database/coinsModel.js`)
- Non commitare il file `config.json` con token reali

## Licenza
MIT

## Contatti / Supporto
Apri un issue nel repository per bug o richieste di feature. Indica Node.js versione, log d'errore e i passaggi per