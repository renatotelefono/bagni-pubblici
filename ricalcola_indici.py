import pandas as pd
from supabase import create_client

SUPABASE_URL = "https://hkvhsjfyquoqmdeodkfl.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrdmhzamZ5cXVvcW1kZW9ka2ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MjU3MjAsImV4cCI6MjA4MzMwMTcyMH0.iXn3LLiTOWShDsfftKd8WkEe35xOhCFyuCSnOWgLmgg"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("📊 Recupero dati attuali...")

# Scarica tutti gli indici
result = supabase.table('province_danger_index').select('*').execute()
province = result.data

print(f"✅ Trovate {len(province)} province")

# Calcola statistiche
indici = [p['indice_pericolosita'] for p in province]
print(f"\n📈 Distribuzione attuale:")
print(f"  - Min: {min(indici):.2f}")
print(f"  - Max: {max(indici):.2f}")
print(f"  - Media: {sum(indici)/len(indici):.2f}")

# Ricalcola con scala logaritmica per normalizzare
import math

max_indice = max(indici)
min_indice = min(indici)

print(f"\n🔄 Ricalcolo indici con nuova formula...")

updates = []
for prov in province:
    old_indice = prov['indice_pericolosita']
    
    # Normalizza su scala 0-100 con distribuzione più realistica
    # Formula: usa percentile invece di valore assoluto
    percentile = (old_indice - min_indice) / (max_indice - min_indice)
    
    # Applica scala quadratica per aumentare la differenziazione
    new_indice = percentile ** 1.5 * 100
    
    # Ricategorizza
    if new_indice < 25:
        categoria = "basso"
    elif new_indice < 50:
        categoria = "medio"
    elif new_indice < 75:
        categoria = "alto"
    else:
        categoria = "molto_alto"
    
    updates.append({
        'id': prov['id'],
        'indice_pericolosita': round(new_indice, 2),
        'categoria_rischio': categoria
    })
    
    print(f"  {prov['provincia']}: {old_indice:.2f} → {new_indice:.2f} ({categoria})")

# Aggiorna database
print(f"\n💾 Aggiornamento database...")
for update in updates:
    supabase.table('province_danger_index').update({
        'indice_pericolosita': update['indice_pericolosita'],
        'categoria_rischio': update['categoria_rischio']
    }).eq('id', update['id']).execute()

print(f"\n✅ Aggiornati {len(updates)} record!")

# Nuova distribuzione
new_indici = [u['indice_pericolosita'] for u in updates]
categorie = {}
for u in updates:
    cat = u['categoria_rischio']
    categorie[cat] = categorie.get(cat, 0) + 1

print(f"\n📊 Nuova distribuzione:")
print(f"  - Basso: {categorie.get('basso', 0)} province")
print(f"  - Medio: {categorie.get('medio', 0)} province")
print(f"  - Alto: {categorie.get('alto', 0)} province")
print(f"  - Molto Alto: {categorie.get('molto_alto', 0)} province")

print(f"\n🎉 Fatto! Ricarica la mappa HTML per vedere i nuovi dati.")