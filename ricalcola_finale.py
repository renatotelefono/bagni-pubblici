import pandas as pd
from supabase import create_client
import numpy as np

SUPABASE_URL = "https://hkvhsjfyquoqmdeodkfl.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrdmhzamZ5cXVvcW1kZW9ka2ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MjU3MjAsImV4cCI6MjA4MzMwMTcyMH0.iXn3LLiTOWShDsfftKd8WkEe35xOhCFyuCSnOWgLmgg"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("📊 Recupero dati province...")

# Scarica tutti i dati
result = supabase.table('province_danger_index').select('*').execute()
province = result.data

print(f"✅ Trovate {len(province)} province\n")

# Usa delitti_per_100k come metrica base (già normalizzata per popolazione)
df = pd.DataFrame(province)
df['delitti_per_100k'] = pd.to_numeric(df['delitti_per_100k'])

# Calcola percentili per distribuzione uniforme
df['percentile'] = df['delitti_per_100k'].rank(pct=True) * 100

print("📈 Statistiche delitti_per_100k:")
print(f"  Min: {df['delitti_per_100k'].min():.2f}")
print(f"  25%: {df['delitti_per_100k'].quantile(0.25):.2f}")
print(f"  50%: {df['delitti_per_100k'].quantile(0.50):.2f}")
print(f"  75%: {df['delitti_per_100k'].quantile(0.75):.2f}")
print(f"  Max: {df['delitti_per_100k'].max():.2f}\n")

# Nuova categorizzazione basata su quartili
def categorizza_rischio(percentile):
    if percentile <= 25:
        return "basso"
    elif percentile <= 50:
        return "medio"
    elif percentile <= 75:
        return "alto"
    else:
        return "molto_alto"

df['new_categoria'] = df['percentile'].apply(categorizza_rischio)

# Conta nuova distribuzione
print("🎯 Nuova distribuzione per quartili:")
for cat in ['basso', 'medio', 'alto', 'molto_alto']:
    count = len(df[df['new_categoria'] == cat])
    print(f"  {cat.upper()}: {count} province (~{count/len(df)*100:.0f}%)")

print("\n🔄 Aggiornamento database...")

# Aggiorna ogni record
for idx, row in df.iterrows():
    supabase.table('province_danger_index').update({
        'indice_pericolosita': round(float(row['percentile']), 2),
        'categoria_rischio': row['new_categoria']
    }).eq('id', row['id']).execute()
    
    print(f"  ✅ {row['provincia']}: {row['percentile']:.2f} ({row['new_categoria']})")

print("\n📊 TOP 10 Province Più Sicure:")
top_safe = df.nsmallest(10, 'delitti_per_100k')[['provincia', 'delitti_per_100k', 'percentile', 'new_categoria']]
for idx, row in top_safe.iterrows():
    print(f"  {row['provincia']}: {row['delitti_per_100k']:.1f} delitti/100k (indice: {row['percentile']:.1f})")

print("\n📊 TOP 10 Province Più Pericolose:")
top_danger = df.nlargest(10, 'delitti_per_100k')[['provincia', 'delitti_per_100k', 'percentile', 'new_categoria']]
for idx, row in top_danger.iterrows():
    print(f"  {row['provincia']}: {row['delitti_per_100k']:.1f} delitti/100k (indice: {row['percentile']:.1f})")

print("\n🎉 Ricalcolo completato! Ricarica la mappa HTML.")