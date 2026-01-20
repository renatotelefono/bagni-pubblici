from dotenv import load_dotenv
import os

# Carica variabili d'ambiente
load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY')

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    print("❌ Errore: SUPABASE_URL e SUPABASE_ANON_KEY devono essere configurati nel file .env")
    exit(1)

# Genera file config.js
config_content = f"""// QUESTO FILE È GENERATO AUTOMATICAMENTE - NON MODIFICARE
// Esegui 'python generate_config.py' per rigenerarlo

const CONFIG = {{
    SUPABASE_URL: '{SUPABASE_URL}',
    SUPABASE_ANON_KEY: '{SUPABASE_ANON_KEY}'
}};
"""

with open('config.js', 'w', encoding='utf-8') as f:
    f.write(config_content)

print("✅ File config.js generato con successo!")
print("⚠️  Ricorda: config.js è ignorato da git per sicurezza")