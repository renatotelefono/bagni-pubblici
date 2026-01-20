from dotenv import load_dotenv
import os
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

print("="*60)
print("TEST INSERT CON DATI SEMPLICI")
print("="*60)

print(f"\nURL: {SUPABASE_URL}")
print(f"Service Key: {SERVICE_KEY[:20]}...{SERVICE_KEY[-10:]}")

print("\n🔗 Connessione...")
supabase = create_client(SUPABASE_URL, SERVICE_KEY)
print("✓ Connesso")

# DATI SEMPLICISSIMI
record_test = {
    'id_originale': 123,
    'tipologia': 'Hotel',
    'denominazione': 'Hotel Test',
    'via': 'Via Roma',
    'civico': '1',
    'latitude': 41.9028,
    'longitude': 12.4964,
    'stelle': 3,
    'categoria': 2,
    'totale_posti_letto': 10,
    'totale_numero_camere': 5
}

print("\n📤 Tentativo INSERT con questi dati:")
for key, value in record_test.items():
    print(f"   {key}: {value}")

try:
    print("\n🚀 Esecuzione INSERT...")
    result = supabase.table('strutture_ricettive').insert(record_test).execute()
    
    print("\n✅✅✅ SUCCESSO! ✅✅✅")
    print(f"Record inserito con ID: {result.data[0]['id']}")
    print(f"Dati completi: {result.data[0]}")
    
    # Verifica che sia nel database
    print("\n🔍 Verifica lettura...")
    check = supabase.table('strutture_ricettive').select('*').eq('id_originale', 123).execute()
    print(f"✓ Trovato nel DB: {check.data[0]['denominazione']}")
    
    # Cancella il record di test
    print("\n🗑️ Pulizia...")
    supabase.table('strutture_ricettive').delete().eq('id_originale', 123).execute()
    print("✓ Record di test cancellato")
    
except Exception as e:
    print("\n❌❌❌ ERRORE ❌❌❌")
    print(f"Tipo: {type(e).__name__}")
    print(f"Messaggio: {e}")
    
    # Se c'è un dettaglio
    if hasattr(e, '__dict__'):
        print(f"Dettagli: {e.__dict__}")

print("\n" + "="*60)
print("FINE TEST")
print("="*60)