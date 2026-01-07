"""
Script per importare incidenti_roma_2022.csv su Supabase
"""

import pandas as pd
from supabase import create_client, Client
from datetime import datetime
import sys

# ============================================
# CONFIGURAZIONE - MODIFICA QUESTI VALORI
# ============================================

SUPABASE_URL = "https://hkvhsjfyquoqmdeodkfl.supabase.co"   # ← Inserisci il tuo Project URL
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrdmhzamZ5cXVvcW1kZW9ka2ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MjU3MjAsImV4cCI6MjA4MzMwMTcyMH0.iXn3LLiTOWShDsfftKd8WkEe35xOhCFyuCSnOWgLmgg"  # ← Inserisci la tua anon/public key


CSV_FILE = "incidenti_roma_2022.csv"  # ← Path del tuo CSV

# ============================================
# SCRIPT
# ============================================

def clean_coordinate(value):
    """Converte coordinate da formato italiano (virgola) a float"""
    if pd.isna(value):
        return None
    try:
        # Converti da stringa, sostituisci virgola con punto
        return float(str(value).replace(',', '.'))
    except:
        return None

def clean_integer(value):
    """Converte a intero, gestendo valori nulli"""
    if pd.isna(value):
        return 0
    try:
        return int(value)
    except:
        return 0

def clean_string(value):
    """Pulisce stringhe e gestisce valori nulli"""
    if pd.isna(value) or value == '' or str(value).lower() == 'nan':
        return None
    return str(value).strip()

def clean_date(value):
    """Converte data in formato ISO"""
    if pd.isna(value):
        return None
    try:
        # Prova vari formati di data
        if isinstance(value, str):
            # Formato: YYYY-MM-DD HH:MM:SS o YYYY-MM-DD
            date_str = value.split(' ')[0]  # Prendi solo la parte della data
            return date_str
        return None
    except:
        return None

def main():
    print("=" * 60)
    print("IMPORT INCIDENTI ROMA 2022 → SUPABASE")
    print("=" * 60)
    
    # 1. Connessione a Supabase
    print("\n[1/5] Connessione a Supabase...")
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✅ Connesso!")
    except Exception as e:
        print(f"❌ Errore connessione: {e}")
        sys.exit(1)
    
    # 2. Carica CSV
    print(f"\n[2/5] Caricamento CSV '{CSV_FILE}'...")
    try:
        df = pd.read_csv(CSV_FILE, encoding='utf-8')
        print(f"✅ Caricati {len(df)} record dal CSV")
        print(f"   Colonne trovate: {list(df.columns)[:5]}...")
    except Exception as e:
        print(f"❌ Errore lettura CSV: {e}")
        sys.exit(1)
    
    # 3. Pulisci e trasforma dati
    print("\n[3/5] Pulizia e trasformazione dati...")
    
    records = []
    skipped = 0
    
    for idx, row in df.iterrows():
        # Pulisci coordinate
        lat = clean_coordinate(row.get('Latitudine'))
        lon = clean_coordinate(row.get('Longitudine'))
        
        # Salta record senza coordinate valide
        if lat is None or lon is None:
            skipped += 1
            continue
        
        # Verifica coordinate nell'area di Roma
        if not (41.7 <= lat <= 42.1 and 12.3 <= lon <= 12.7):
            skipped += 1
            continue
        
        # Pulisci data
        incident_date = clean_date(row.get('DataOraIncidente'))
        if incident_date is None:
            skipped += 1
            continue
        
        # Estrai anno e mese
        try:
            date_obj = datetime.strptime(incident_date, '%Y-%m-%d')
            year = date_obj.year
            month = date_obj.month
        except:
            year = None
            month = None
        
        # Crea record pulito
        record = {
            'region': 'Lazio',
            'province': 'Roma',
            'municipality': clean_string(row.get('Localizzazione1')),
            'road_name': clean_string(row.get('Strada1')),
            'road_type': clean_string(row.get('TipoStrada')),
            'latitude': lat,
            'longitude': lon,
            'incident_date': incident_date,
            'year': year,
            'month': month,
            'incident_nature': clean_string(row.get('NaturaIncidente')),
            'deaths': clean_integer(row.get('NUM_MORTI')),
            'total_injuries': clean_integer(row.get('NUM_FERITI')),
            'unharmed': clean_integer(row.get('NUM_ILLESI')),
            'weather_condition': clean_string(row.get('CondizioneAtmosferica')),
            'road_condition': clean_string(row.get('FondoStradale')),
            'pavement_type': clean_string(row.get('Pavimentazione')),
            'traffic_condition': clean_string(row.get('Traffico')),
            'visibility': clean_string(row.get('Visibilita')),
            'road_characteristics': clean_string(row.get('ParticolaritaStrade')),
            'signage': clean_string(row.get('Segnaletica')),
            'data_source': 'ACI-ISTAT Roma 2022'
        }
        
        records.append(record)
    
    print(f"✅ {len(records)} record validi")
    print(f"⚠️  {skipped} record saltati (coordinate mancanti o invalide)")
    
    # 4. Inserisci in Supabase in batch
    print(f"\n[4/5] Inserimento in Supabase (batch di 100)...")
    
    BATCH_SIZE = 100
    total_inserted = 0
    errors = 0
    
    for i in range(0, len(records), BATCH_SIZE):
        batch = records[i:i + BATCH_SIZE]
        
        try:
            result = supabase.table('incidents_italy').insert(batch).execute()
            total_inserted += len(batch)
            print(f"   ✅ Batch {i//BATCH_SIZE + 1}: {len(batch)} record inseriti")
        except Exception as e:
            errors += 1
            print(f"   ❌ Errore batch {i//BATCH_SIZE + 1}: {e}")
    
    # 5. Riepilogo
    print("\n[5/5] Riepilogo:")
    print("=" * 60)
    print(f"✅ Record inseriti con successo: {total_inserted}")
    print(f"⚠️  Record saltati: {skipped}")
    print(f"❌ Errori durante inserimento: {errors}")
    print("=" * 60)
    
    # 6. Verifica finale
    print("\n[VERIFICA] Controllo dati inseriti...")
    try:
        result = supabase.table('incidents_italy').select('id', count='exact').execute()
        count = result.count if hasattr(result, 'count') else len(result.data)
        print(f"✅ Totale record in database: {count}")
    except Exception as e:
        print(f"⚠️  Impossibile verificare: {e}")
    
    print("\n🎉 IMPORT COMPLETATO!")
    print("\nPuoi verificare i dati su:")
    print(f"   {SUPABASE_URL.replace('https://', 'https://app.')}/project/_/editor")

if __name__ == "__main__":
    main()