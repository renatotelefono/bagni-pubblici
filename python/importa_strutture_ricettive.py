import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv
import os
import sys

load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
CSV_PATH = os.getenv('CSV_PATH')

if not all([SUPABASE_URL, SUPABASE_KEY, CSV_PATH]):
    print("❌ Variabili mancanti in .env")
    sys.exit(1)

if not os.path.exists(CSV_PATH):
    print(f"❌ File CSV non trovato: {CSV_PATH}")
    sys.exit(1)

print("🔗 Connessione a Supabase...")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print(f"📁 Lettura CSV: {CSV_PATH}")
df = pd.read_csv(CSV_PATH)
print(f"✓ Trovate {len(df)} righe")

# Funzioni conversione
def to_bool(value):
    if pd.isna(value) or value == '':
        return False
    return str(value).lower() in ['true', '1', 'si', 'yes', 's', 'y', '1.0']

def to_int(value):
    if pd.isna(value) or value == '':
        return None
    try:
        return int(float(value))
    except:
        return None

def to_float(value):
    if pd.isna(value) or value == '':
        return None
    try:
        return float(value)
    except:
        return None

def clean_string(value):
    if pd.isna(value) or value == '':
        return None
    result = str(value).strip()
    return result if result else None

print("\n🔄 Preparazione dati...")
records = []
skipped = 0

for idx, row in df.iterrows():
    lat = to_float(row['latitude'])
    lon = to_float(row['longitude'])
    
    if lat is None or lon is None:
        skipped += 1
        continue
    
    try:
        record = {
            'id_originale': to_int(row['id']),  # SENZA _id
            'tipologia': clean_string(row['tipologia']),
            'denominazione': clean_string(row['denominazione']),
            'via': clean_string(row['via']),
            'civico': clean_string(row['civico']),
            'latitude': lat,
            'longitude': lon,
            'stelle': to_int(row['stelle']),
            'categoria': to_int(row['categoria']),
            'totale_posti_letto': to_int(row['totalePostiLetto']),
            'totale_numero_camere': to_int(row['totaleNumeroCamere']),
            'numero_singole': to_int(row['numeroSingole']),
            'numero_doppie': to_int(row['numeroDoppie']),
            'numero_triple': to_int(row['numeroTriple']),
            'numero_quadruple': to_int(row['numeroQuadruple']),
            'numero_bagni': to_int(row['numeroBagni']),
            'contatto_cellulare': clean_string(row['contattoCellulare']),
            'contatto_email': clean_string(row['contattoEmail']),
            'contatto_facebook': clean_string(row['contattoFacebook']),
            'contatto_instagram': clean_string(row['contattoInstagram']),
            'contatto_telefono': clean_string(row['contattoTelefono']),
            'contatto_website': clean_string(row['contattoWebSite']),
            'contatto_fax': clean_string(row['contattoFax']),
            'contatto_twitter': clean_string(row['contattoTwitter']),
            'accessibile_disabili': to_bool(row['accessibileDisabili']),
            'accettazione_gruppi': to_bool(row['accettazioneGruppi']),
            'accetta_animali_piccola_taglia': to_bool(row['accettaAnimaliPiccolaTaglia']),
            'attivita_sportive': to_bool(row['attivitaSportive']),
            'deposito_valori': to_bool(row['depositoValori']),
            'lavanderia': to_bool(row['lavanderia']),
            'ristorante': to_bool(row['ristorante']),
            'tennis': to_bool(row['tennis']),
            'parco': to_bool(row['parco']),
            'pista_ballo': to_bool(row['pistaBallo']),
            'servizio_telefono': to_bool(row['servizioTelefono']),
            'televisione': to_bool(row['televisione']),
            'tennis_tavolo': to_bool(row['tennisTavolo']),
            'aria_condizionata': to_bool(row['ariaCondizionata']),
            'copertura_wifi': to_bool(row['coperturaWifi']),
            'piscina': to_bool(row['piscina']),
            'parcheggio_custodito': to_bool(row['parcheggioCustodito']),
            'vendita_alimenti_propria_produzione': to_bool(row['venditaAlimentiPropriaProduzione']),
            'trasporto_clienti': to_bool(row['trasportoClienti']),
            'bar': to_bool(row['bar']),
            'cassetta_sicurezza': to_bool(row['cassettaSicurezza']),
            'presa_telefonica_modem': to_bool(row['presaTelefonicaModem']),
            'spaccio': to_bool(row['spaccio']),
            'campi_bocce': to_bool(row['campiBocce']),
            'campo_beach_volley': to_bool(row['campoBeachVolley']),
            'campo_calcetto': to_bool(row['campoCalcetto']),
            'campo_pallavolo': to_bool(row['campoPallavolo']),
            'attracco_natanti': to_bool(row['attraccoNatanti']),
            'numero_bungalow': to_int(row['numeroBungalow']),
            'numero_docce': to_int(row['numeroDocce']),
            'numero_lavadini': to_int(row['numeroLavadini']),
            'numero_piazzole': to_int(row['numeroPiazzole'])
        }
        records.append(record)
    except Exception as e:
        print(f"⚠️ Errore riga {idx + 2}: {e}")
        skipped += 1

print(f"✓ {len(records)} record pronti")
if skipped > 0:
    print(f"⚠️ {skipped} righe saltate")

if len(records) == 0:
    print("❌ Nessun record da importare!")
    sys.exit(1)

# Import
print("\n📤 Inizio import...")
batch_size = 100
total_inserted = 0
total_errors = 0

for i in range(0, len(records), batch_size):
    batch = records[i:i+batch_size]
    batch_num = i//batch_size + 1
    total_batches = (len(records)-1)//batch_size + 1
    
    try:
        response = supabase.table('strutture_ricettive').insert(batch).execute()
        total_inserted += len(batch)
        print(f"✓ Batch {batch_num}/{total_batches}: {len(batch)} record inseriti")
    except Exception as e:
        total_errors += len(batch)
        print(f"❌ Errore batch {batch_num}: {str(e)[:100]}")

print("\n" + "="*60)
print(f"{'✅' if total_errors == 0 else '⚠️'} Import completato!")
print(f"   Record inseriti: {total_inserted}/{len(records)}")
if total_errors > 0:
    print(f"   Errori: {total_errors}")
print("="*60)