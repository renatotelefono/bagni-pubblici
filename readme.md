# Mappa Strutture Ricettive - Roma

Applicazione web per visualizzare le strutture ricettive di Roma su una mappa interattiva.

## Setup Iniziale

### 1. Installa le dipendenze Python
```bash
pip install -r requirements.txt
```

### 2. Configura le variabili d'ambiente

Copia `.env.example` in `.env` e inserisci le tue credenziali:
```bash
cp .env.example .env
```

Modifica `.env` con le tue credenziali Supabase.

### 3. Crea la tabella su Supabase

Vai su Supabase > SQL Editor ed esegui lo script SQL fornito.

### 4. Importa i dati
```bash
python import_data.py
```

### 5. Genera il file di configurazione JavaScript
```bash
python generate_config.py
```

### 6. Apri l'applicazione

Apri `index.html` nel browser oppure usa un server locale:
```bash
python -m http.server 8000
```

Poi vai su `http://localhost:8000`

## Struttura File

- `.env` - Credenziali (non committare!)
- `.env.example` - Template per le credenziali
- `import_data.py` - Script per importare dati da CSV
- `generate_config.py` - Genera config.js da .env
- `index.html` - Applicazione web
- `config.js` - Configurazione JS (generato automaticamente)

## Sicurezza

⚠️ **IMPORTANTE**: 
- Non committare mai `.env` o `config.js`
- Usa `.gitignore` per escluderli
- Usa solo `SUPABASE_ANON_KEY` nel frontend (non la service key!)