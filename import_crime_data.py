import pandas as pd
import numpy as np
from supabase import create_client
import json
import re

# ============================================
# CONFIGURAZIONE SUPABASE
# ============================================

SUPABASE_URL = "https://hkvhsjfyquoqmdeodkfl.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrdmhzamZ5cXVvcW1kZW9ka2ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MjU3MjAsImV4cCI6MjA4MzMwMTcyMH0.iXn3LLiTOWShDsfftKd8WkEe35xOhCFyuCSnOWgLmgg"

# ============================================
# PESI REATI (scala 1-10)
# ============================================

PESO_REATI = {
    "ATTENTATI": 8,
    "OMICIDI VOLONTARI CONSUMATI": 10,
    "INFANTICIDI": 10,
    "TENTATI OMICIDI": 9,
    "OMICIDIO PRETERINTENZIONALE": 8,
    "OMICIDI COLPOSI": 6,
    "VIOLENZE SESSUALI": 9,
    "ATTI SESSUALI CON MINORENNE": 9,
    "CORRUZIONE DI MINORENNE": 8,
    "PORNOGRAFIA MINORILE": 8,
    "SEQUESTRI DI PERSONA": 8,
    "SEQUESTRO A SCOPO DI ESTORSIONE": 9,
    "RAPINE": 7,
    "ESTORSIONI": 6,
    "USURA": 6,
    "ASSOCIAZIONE PER DELINQUERE": 7,
    "ASSOCIAZIONE DI TIPO MAFIOSO": 8,
    "LESIONI DOLOSE": 5,
    "PERCOSSE": 3,
    "MINACCE": 4,
    "INGIURIE": 2,
    "FURTI": 2,
    "FURTI IN ABITAZIONE": 4,
    "FURTI CON STRAPPO": 5,
    "FURTI IN ESERCIZI COMMERCIALI": 3,
    "FURTI DI AUTOVETTURE": 3,
    "RICETTAZIONE": 3,
    "RICICLAGGIO": 4,
    "TRUFFE E FRODI INFORMATICHE": 3,
    "DANNEGGIAMENTI": 2,
    "INCENDI": 5,
    "VIOLAZIONI LEGGE STUPEFACENTI": 5,
    "CONTRABBANDO": 4,
}

# ============================================
# POPOLAZIONE PROVINCE 2020 (fonte ISTAT)
# ============================================

POPOLAZIONE_PROVINCE = {
    # Piemonte
    "Torino": 2259523,
    "Vercelli": 170906,
    "Novara": 365988,
    "Cuneo": 586017,
    "Asti": 213964,
    "Alessandria": 421081,
    "Biella": 175585,
    "Verbano-Cusio-Ossola": 157864,
    
    # Valle d'Aosta
    "Aosta": 125501,
    
    # Lombardia
    "Milano": 3250315,
    "Bergamo": 1114590,
    "Brescia": 1265954,
    "Como": 599204,
    "Cremona": 358955,
    "Lecco": 337380,
    "Lodi": 230198,
    "Mantova": 412292,
    "Monza e della Brianza": 873935,
    "Pavia": 545888,
    "Sondrio": 181095,
    "Varese": 890768,
    
    # Trentino-Alto Adige
    "Bolzano": 531178,
    "Trento": 541098,
    
    # Veneto
    "Verona": 926497,
    "Vicenza": 865082,
    "Belluno": 201760,
    "Treviso": 887806,
    "Venezia": 853338,
    "Padova": 937908,
    "Rovigo": 234746,
    
    # Friuli-Venezia Giulia
    "Udine": 530849,
    "Gorizia": 140611,
    "Trieste": 234668,
    "Pordenone": 314487,
    
    # Liguria
    "Genova": 846515,
    "Imperia": 213840,
    "La Spezia": 219556,
    "Savona": 277325,
    
    # Emilia-Romagna
    "Bologna": 1017196,
    "Ferrara": 345691,
    "Forlì-Cesena": 394627,
    "Modena": 705393,
    "Parma": 451631,
    "Piacenza": 287152,
    "Ravenna": 391997,
    "Reggio nell'Emilia": 532872,
    "Rimini": 339017,
    
    # Toscana
    "Arezzo": 343592,
    "Firenze": 1011349,
    "Grosseto": 221507,
    "Livorno": 334832,
    "Lucca": 389220,
    "Massa-Carrara": 194878,
    "Pisa": 421642,
    "Pistoia": 292473,
    "Prato": 257716,
    "Siena": 268706,
    
    # Umbria
    "Perugia": 656382,
    "Terni": 225633,
    
    # Marche
    "Ancona": 474576,
    "Ascoli Piceno": 205733,
    "Fermo": 172539,
    "Macerata": 315223,
    "Pesaro e Urbino": 358886,
    
    # Lazio
    "Roma": 4342212,
    "Frosinone": 489873,
    "Latina": 579383,
    "Rieti": 153749,
    "Viterbo": 317030,
    
    # Abruzzo
    "L'Aquila": 299556,
    "Chieti": 387649,
    "Pescara": 319936,
    "Teramo": 307603,
    
    # Molise
    "Campobasso": 221238,
    "Isernia": 84379,
    
    # Campania
    "Avellino": 423977,
    "Benevento": 277107,
    "Caserta": 922965,
    "Napoli": 3082905,
    "Salerno": 1098513,
    
    # Puglia
    "Bari": 1251994,
    "Barletta-Andria-Trani": 391097,
    "Brindisi": 394090,
    "Foggia": 621299,
    "Lecce": 796806,
    "Taranto": 578828,
    
    # Basilicata
    "Matera": 198204,
    "Potenza": 365891,
    
    # Calabria
    "Catanzaro": 359927,
    "Cosenza": 705753,
    "Crotone": 174605,
    "Reggio di Calabria": 548009,
    "Vibo Valentia": 160073,
    
    # Sicilia
    "Agrigento": 436903,
    "Caltanissetta": 268752,
    "Catania": 1107702,
    "Enna": 164788,
    "Messina": 631297,
    "Palermo": 1252588,
    "Ragusa": 320893,
    "Siracusa": 399224,
    "Trapani": 430492,
    
    # Sardegna
    "Cagliari": 431038,
    "Nuoro": 210972,
    "Oristano": 157965,
    "Sassari": 493357,
    "Sud Sardegna": 356396,
}

# ============================================
# COORDINATE CAPOLUOGHI (lat, lon)
# ============================================

COORDINATE_PROVINCE = {
    # Piemonte
    "Torino": {"lat": 45.0703, "lon": 7.6869},
    "Vercelli": {"lat": 45.3206, "lon": 8.4186},
    "Novara": {"lat": 45.4469, "lon": 8.6219},
    "Cuneo": {"lat": 44.3841, "lon": 7.5426},
    "Asti": {"lat": 44.9009, "lon": 8.2065},
    "Alessandria": {"lat": 44.9132, "lon": 8.6151},
    "Biella": {"lat": 45.5628, "lon": 8.0584},
    "Verbano-Cusio-Ossola": {"lat": 45.9215, "lon": 8.5520},
    
    # Valle d'Aosta
    "Aosta": {"lat": 45.7376, "lon": 7.3203},
    
    # Lombardia
    "Milano": {"lat": 45.4642, "lon": 9.1900},
    "Bergamo": {"lat": 45.6983, "lon": 9.6773},
    "Brescia": {"lat": 45.5416, "lon": 10.2118},
    "Como": {"lat": 45.8080, "lon": 9.0852},
    "Cremona": {"lat": 45.1334, "lon": 10.0227},
    "Lecco": {"lat": 45.8563, "lon": 9.3988},
    "Lodi": {"lat": 45.3142, "lon": 9.5034},
    "Mantova": {"lat": 45.1564, "lon": 10.7914},
    "Monza e della Brianza": {"lat": 45.5845, "lon": 9.2744},
    "Pavia": {"lat": 45.1847, "lon": 9.1582},
    "Sondrio": {"lat": 46.1699, "lon": 9.8782},
    "Varese": {"lat": 45.8206, "lon": 8.8250},
    
    # Trentino-Alto Adige
    "Bolzano": {"lat": 46.4983, "lon": 11.3548},
    "Trento": {"lat": 46.0664, "lon": 11.1257},
    
    # Veneto
    "Verona": {"lat": 45.4384, "lon": 10.9916},
    "Vicenza": {"lat": 45.5455, "lon": 11.5354},
    "Belluno": {"lat": 46.1377, "lon": 12.2152},
    "Treviso": {"lat": 45.6669, "lon": 12.2430},
    "Venezia": {"lat": 45.4408, "lon": 12.3155},
    "Padova": {"lat": 45.4064, "lon": 11.8768},
    "Rovigo": {"lat": 45.0704, "lon": 11.7901},
    
    # Friuli-Venezia Giulia
    "Udine": {"lat": 46.0710, "lon": 13.2345},
    "Gorizia": {"lat": 45.9411, "lon": 13.6222},
    "Trieste": {"lat": 45.6495, "lon": 13.7768},
    "Pordenone": {"lat": 45.9636, "lon": 12.6607},
    
    # Liguria
    "Genova": {"lat": 44.4056, "lon": 8.9463},
    "Imperia": {"lat": 43.8879, "lon": 8.0276},
    "La Spezia": {"lat": 44.1024, "lon": 9.8249},
    "Savona": {"lat": 44.3086, "lon": 8.4810},
    
    # Emilia-Romagna
    "Bologna": {"lat": 44.4949, "lon": 11.3426},
    "Ferrara": {"lat": 44.8381, "lon": 11.6198},
    "Forlì-Cesena": {"lat": 44.2226, "lon": 12.0403},
    "Modena": {"lat": 44.6471, "lon": 10.9252},
    "Parma": {"lat": 44.8015, "lon": 10.3279},
    "Piacenza": {"lat": 45.0526, "lon": 9.6928},
    "Ravenna": {"lat": 44.4184, "lon": 12.2035},
    "Reggio nell'Emilia": {"lat": 44.6989, "lon": 10.6297},
    "Rimini": {"lat": 44.0678, "lon": 12.5695},
    
    # Toscana
    "Arezzo": {"lat": 43.4632, "lon": 11.8796},
    "Firenze": {"lat": 43.7696, "lon": 11.2558},
    "Grosseto": {"lat": 42.7635, "lon": 11.1135},
    "Livorno": {"lat": 43.5485, "lon": 10.3106},
    "Lucca": {"lat": 43.8376, "lon": 10.4950},
    "Massa-Carrara": {"lat": 44.0366, "lon": 10.1412},
    "Pisa": {"lat": 43.7228, "lon": 10.4017},
    "Pistoia": {"lat": 43.9330, "lon": 10.9178},
    "Prato": {"lat": 43.8777, "lon": 11.1022},
    "Siena": {"lat": 43.3188, "lon": 11.3308},
    
    # Umbria
    "Perugia": {"lat": 43.1107, "lon": 12.3908},
    "Terni": {"lat": 42.5635, "lon": 12.6450},
    
    # Marche
    "Ancona": {"lat": 43.6158, "lon": 13.5189},
    "Ascoli Piceno": {"lat": 42.8534, "lon": 13.5759},
    "Fermo": {"lat": 43.1605, "lon": 13.7185},
    "Macerata": {"lat": 43.2997, "lon": 13.4533},
    "Pesaro e Urbino": {"lat": 43.9103, "lon": 12.9133},
    
    # Lazio
    "Roma": {"lat": 41.9028, "lon": 12.4964},
    "Frosinone": {"lat": 41.6396, "lon": 13.3508},
    "Latina": {"lat": 41.4677, "lon": 12.9036},
    "Rieti": {"lat": 42.4048, "lon": 12.8569},
    "Viterbo": {"lat": 42.4208, "lon": 12.1078},
    
    # Abruzzo
    "L'Aquila": {"lat": 42.3498, "lon": 13.3995},
    "Chieti": {"lat": 42.3510, "lon": 14.1677},
    "Pescara": {"lat": 42.4618, "lon": 14.2144},
    "Teramo": {"lat": 42.6589, "lon": 13.7040},
    
    # Molise
    "Campobasso": {"lat": 41.5630, "lon": 14.6563},
    "Isernia": {"lat": 41.5895, "lon": 14.2334},
    
    # Campania
    "Avellino": {"lat": 40.9142, "lon": 14.7906},
    "Benevento": {"lat": 41.1295, "lon": 14.7820},
    "Caserta": {"lat": 41.0732, "lon": 14.3328},
    "Napoli": {"lat": 40.8518, "lon": 14.2681},
    "Salerno": {"lat": 40.6824, "lon": 14.7681},
    
    # Puglia
    "Bari": {"lat": 41.1171, "lon": 16.8719},
    "Barletta-Andria-Trani": {"lat": 41.3205, "lon": 16.2814},
    "Brindisi": {"lat": 40.6327, "lon": 17.9463},
    "Foggia": {"lat": 41.4621, "lon": 15.5446},
    "Lecce": {"lat": 40.3515, "lon": 18.1750},
    "Taranto": {"lat": 40.4762, "lon": 17.2303},
    
    # Basilicata
    "Matera": {"lat": 40.6663, "lon": 16.6043},
    "Potenza": {"lat": 40.6420, "lon": 15.7990},
    
    # Calabria
    "Catanzaro": {"lat": 38.9098, "lon": 16.5877},
    "Cosenza": {"lat": 39.2979, "lon": 16.2546},
    "Crotone": {"lat": 39.0808, "lon": 17.1253},
    "Reggio di Calabria": {"lat": 38.1113, "lon": 15.6473},
    "Vibo Valentia": {"lat": 38.6757, "lon": 16.1008},
    
    # Sicilia
    "Agrigento": {"lat": 37.3109, "lon": 13.5765},
    "Caltanissetta": {"lat": 37.4903, "lon": 14.0625},
    "Catania": {"lat": 37.5079, "lon": 15.0830},
    "Enna": {"lat": 37.5671, "lon": 14.2792},
    "Messina": {"lat": 38.1938, "lon": 15.5540},
    "Palermo": {"lat": 38.1157, "lon": 13.3615},
    "Ragusa": {"lat": 36.9265, "lon": 14.7256},
    "Siracusa": {"lat": 37.0755, "lon": 15.2866},
    "Trapani": {"lat": 38.0176, "lon": 12.5365},
    
    # Sardegna
    "Cagliari": {"lat": 39.2238, "lon": 9.1217},
    "Nuoro": {"lat": 40.3210, "lon": 9.3300},
    "Oristano": {"lat": 39.9034, "lon": 8.5912},
    "Sassari": {"lat": 40.7259, "lon": 8.5594},
    "Sud Sardegna": {"lat": 39.1642, "lon": 8.5593},
}

# ============================================
# FUNZIONI UTILITY
# ============================================

def normalizza_provincia(nome):
    """Normalizza i nomi delle province per matching"""
    # Rimuovi apostrofi e caratteri speciali
    nome = nome.replace("'", " ").strip()
    
    # Mapping province particolari
    mappings = {
        "L Aquila": "L'Aquila",
        "Verbania": "Verbano-Cusio-Ossola",
        "Monza-Brianza": "Monza e della Brianza",
        "Monza Brianza": "Monza e della Brianza",
        "Forli-Cesena": "Forlì-Cesena",
        "Forli Cesena": "Forlì-Cesena",
        "Reggio Emilia": "Reggio nell'Emilia",
        "Massa Carrara": "Massa-Carrara",
        "Pesaro Urbino": "Pesaro e Urbino",
        "Barletta Andria Trani": "Barletta-Andria-Trani",
        "Reggio Calabria": "Reggio di Calabria",
    }
    
    return mappings.get(nome, nome)

def estrai_peso_reato(descrizione_reato):
    """Estrae il peso del reato dalla descrizione"""
    descrizione_upper = descrizione_reato.upper()
    
    # Cerca corrispondenza esatta
    for key, peso in PESO_REATI.items():
        if key in descrizione_upper:
            return peso
    
    # Pesi di default per categorie generiche
    if "OMICID" in descrizione_upper:
        return 9
    elif "VIOLEN" in descrizione_upper:
        return 7
    elif "RAPINA" in descrizione_upper or "ESTORSION" in descrizione_upper:
        return 7
    elif "FURTO" in descrizione_upper:
        return 2
    elif "DROGA" in descrizione_upper or "STUPEFACENT" in descrizione_upper:
        return 5
    elif "TRUFF" in descrizione_upper or "FROD" in descrizione_upper:
        return 3
    else:
        return 1  # Peso minimo per reati non classificati

# ============================================
# CALCOLO INDICI
# ============================================

def calcola_indice_provincia(df_provincia):
    """
    Calcola l'indice di pericolosità per una provincia
    
    Formula:
    - Punteggio ponderato = Σ (num_delitti * peso_reato)
    - Indice = (punteggio_ponderato / popolazione) * 10000
    - Normalizzato su scala 0-100
    """
    
    provincia = normalizza_provincia(df_provincia.iloc[0]['capoluogo'])
    popolazione = POPOLAZIONE_PROVINCE.get(provincia)
    
    if not popolazione:
        print(f"⚠️  Popolazione non trovata per: {provincia}")
        popolazione = 100000  # Default
    
    # Aggiungi peso a ogni reato
    df_provincia = df_provincia.copy()
    df_provincia['peso'] = df_provincia['reato'].apply(estrai_peso_reato)
    df_provincia['punteggio'] = df_provincia['totale_delitti'] * df_provincia['peso']
    
    # Calcoli
    totale_delitti = df_provincia['totale_delitti'].sum()
    punteggio_totale = df_provincia['punteggio'].sum()
    
    # Normalizza per popolazione
    delitti_per_100k = (totale_delitti / popolazione) * 100000
    
    # Indice di pericolosità (0-100)
    # Formula: considera la gravità ponderata
    indice_base = (punteggio_totale / popolazione) * 10000
    indice_pericolosita = min(100, indice_base)
    
    # Categorizza rischio
    if indice_pericolosita < 20:
        categoria = "basso"
    elif indice_pericolosita < 40:
        categoria = "medio"
    elif indice_pericolosita < 70:
        categoria = "alto"
    else:
        categoria = "molto_alto"
    
    # Top 10 reati
    top_reati = df_provincia.nlargest(10, 'totale_delitti')[['reato', 'totale_delitti']].to_dict('records')
    
    # Statistiche per categoria
    categorie_reati = {
        'violenti': int(df_provincia[df_provincia['peso'] >= 7]['totale_delitti'].sum()),
        'contro_patrimonio': int(df_provincia[df_provincia['reato'].str.contains('FURT|RAPINA|ESTORSION', case=False, na=False)]['totale_delitti'].sum()),
        'contro_persona': int(df_provincia[df_provincia['reato'].str.contains('OMICID|LESION|VIOLEN', case=False, na=False)]['totale_delitti'].sum()),
    }
    
    return {
        'totale_delitti': int(totale_delitti),
        'indice_pericolosita': round(float(indice_pericolosita), 2),
        'delitti_per_100k': round(float(delitti_per_100k), 2),
        'categoria_rischio': categoria,
        'popolazione': int(popolazione),
        'dettaglio_reati': top_reati,
        'categorie_reati': categorie_reati
    }

# ============================================
# IMPORT SU SUPABASE
# ============================================

def import_dati_grezzi(df, supabase, anno=2020):
    """Importa i dati grezzi del CSV su Supabase"""
    
    print("\n📤 FASE 1: Import dati grezzi...")
    
    # Prepara records
    records = []
    for _, row in df.iterrows():
        provincia = normalizza_provincia(row['capoluogo'])
        popolazione = POPOLAZIONE_PROVINCE.get(provincia)
        
        records.append({
            'regione': row['regione'],
            'provincia': provincia,
            'capoluogo': provincia,
            'reato': row['reato'],
            'codice_reato': row['reato'].split()[0] if ' ' in row['reato'] else '',
            'totale_delitti': int(row['totale_delitti']),
            'anno': anno,
            'popolazione': popolazione
        })
    
    # Insert in batch (1000 per volta per limiti Supabase)
    batch_size = 1000
    total_inserted = 0
    
    for i in range(0, len(records), batch_size):
        batch = records[i:i+batch_size]
        try:
            result = supabase.table('crime_stats').insert(batch).execute()
            total_inserted += len(batch)
            print(f"  ✅ Inseriti {total_inserted}/{len(records)} record")
        except Exception as e:
            print(f"  ❌ Errore batch {i}: {e}")
    
    print(f"✅ Import completato: {total_inserted} record inseriti")

def calcola_e_importa_indici(df, supabase, anno=2020):
    """Calcola gli indici di pericolosità e li importa"""
    
    print("\n📊 FASE 2: Calcolo indici di pericolosità...")
    
    # Raggruppa per provincia
    province_groups = df.groupby('capoluogo')
    
    indici = []
    errori = []
    
    for capoluogo_raw, group in province_groups:
        provincia = normalizza_provincia(capoluogo_raw)
        
        try:
            # Calcola indice
            stats = calcola_indice_provincia(group)
            
            # Ottieni coordinate
            coords = COORDINATE_PROVINCE.get(provincia)
            if not coords:
                print(f"  ⚠️  Coordinate non trovate per: {provincia}")
                coords = {"lat": 42.0, "lon": 12.0}  # Centro Italia default
            
            indici.append({
                'provincia': provincia,
                'regione': group.iloc[0]['regione'],
                'capoluogo': provincia,
                'latitude': coords['lat'],
                'longitude': coords['lon'],
                'anno': anno,
                **stats
            })
            
            print(f"  ✅ {provincia}: Indice={stats['indice_pericolosita']:.2f}, Rischio={stats['categoria_rischio']}")
            
        except Exception as e:
            errori.append(f"{provincia}: {e}")
            print(f"  ❌ Errore {provincia}: {e}")
    
    # Insert indici
    if indici:
        try:
            result = supabase.table('province_danger_index').insert(indici).execute()
            print(f"\n✅ Inseriti {len(indici)} indici provinciali")
        except Exception as e:
            print(f"❌ Errore inserimento indici: {e}")
    
    # Report errori
    if errori:
        print(f"\n⚠️  {len(errori)} errori durante il calcolo:")
        for err in errori:
            print(f"  - {err}")
    
    return indici

# ============================================
# STATISTICHE E REPORT
# ============================================

def genera_report(indici):
    """Genera un report statistico"""
    
    print("\n" + "="*60)
    print("📊 REPORT INDICI DI PERICOLOSITÀ")
    print("="*60)
    
    df_indici = pd.DataFrame(indici)
    
    print(f"\n🔢 Statistiche Generali:")
    print(f"  - Province analizzate: {len(df_indici)}")
    print(f"  - Indice medio: {df_indici['indice_pericolosita'].mean():.2f}")
    print(f"  - Indice mediano: {df_indici['indice_pericolosita'].median():.2f}")
    
    print(f"\n🎯 Distribuzione per Rischio:")
    for cat in ['basso', 'medio', 'alto', 'molto_alto']:
        count = len(df_indici[df_indici['categoria_rischio'] == cat])
        perc = (count / len(df_indici)) * 100
        print(f"  - {cat.upper()}: {count} province ({perc:.1f}%)")
    
    print(f"\n🔴 TOP 10 Province Più Pericolose:")
    top_10 = df_indici.nlargest(10, 'indice_pericolosita')[['provincia', 'indice_pericolosita', 'categoria_rischio']]
    for i, row in enumerate(top_10.itertuples(), 1):
        print(f"  {i}. {row.provincia}: {row.indice_pericolosita:.2f} ({row.categoria_rischio})")
    
    print(f"\n🟢 TOP 10 Province Più Sicure:")
    bottom_10 = df_indici.nsmallest(10, 'indice_pericolosita')[['provincia', 'indice_pericolosita', 'categoria_rischio']]
    for i, row in enumerate(bottom_10.itertuples(), 1):
        print(f"  {i}. {row.provincia}: {row.indice_pericolosita:.2f} ({row.categoria_rischio})")
    
    print("\n" + "="*60)

# ============================================
# MAIN
# ============================================

def main():
    print("🚀 IMPORT DATI CRIMINALITÀ ITALIA")
    print("="*60)
    
    # 1. Carica CSV
    print("\n📂 Caricamento CSV...")
    try:
        df = pd.read_csv('delitti_2020.csv')
        print(f"✅ CSV caricato: {len(df)} righe, {len(df['capoluogo'].unique())} province")
    except Exception as e:
        print(f"❌ Errore caricamento CSV: {e}")
        return
    
    # 2. Connetti a Supabase
    print("\n🔌 Connessione a Supabase...")
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✅ Connesso a Supabase")
    except Exception as e:
        print(f"❌ Errore connessione: {e}")
        return
    
    # 3. Conferma import
    risposta = input("\n⚠️  Vuoi procedere con l'import? (s/n): ")
    if risposta.lower() != 's':
        print("❌ Import annullato")
        return
    
    # 4. Import dati grezzi
    import_dati_grezzi(df, supabase, anno=2020)
    
    # 5. Calcola e importa indici
    indici = calcola_e_importa_indici(df, supabase, anno=2020)
    
    # 6. Genera report
    if indici:
        genera_report(indici)
    
    print("\n🎉 PROCESSO COMPLETATO!")
    print("Ora puoi aprire l'HTML per visualizzare la mappa.")

if __name__ == "__main__":
    main()