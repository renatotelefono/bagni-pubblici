import pandas as pd

# Leggi il CSV con separatore punto e virgola
print("📁 Lettura CSV con separatore ';'...")

df = pd.read_csv(
    r'C:\Users\HP\Desktop\bagni-pubblici\suar2025-01.csv',
    sep=';',  # SEPARATORE PUNTO E VIRGOLA
    encoding='utf-8',
    low_memory=False
)

print(f"\n📊 Dataset originale:")
print(f"   Righe: {len(df)}")
print(f"   Colonne: {len(df.columns)}")
print(f"\n   Tutte le colonne:")
for i, col in enumerate(df.columns, 1):
    print(f"      {i}. {col}")

# Trova l'indice della colonna 'numeroBagni'
if 'numeroBagni' in df.columns:
    indice_numero_bagni = df.columns.get_loc('numeroBagni')
    
    print(f"\n✅ Colonna 'numeroBagni' trovata alla posizione {indice_numero_bagni + 1}")
    
    # Seleziona solo le colonne fino a numeroBagni (incluso)
    colonne_da_mantenere = df.columns[:indice_numero_bagni + 1].tolist()
    
    print(f"\n✂️  Taglio le colonne dopo 'numeroBagni'...")
    print(f"   Colonne originali: {len(df.columns)}")
    print(f"   Colonne mantenute: {len(colonne_da_mantenere)}")
    print(f"   Colonne eliminate: {len(df.columns) - len(colonne_da_mantenere)}")
    
    # Crea nuovo dataframe
    df_pulito = df[colonne_da_mantenere]
    
    # Salva il nuovo CSV
    df_pulito.to_csv(
        r'C:\Users\HP\Desktop\bagni-pubblici\suar2025-01_pulito.csv',
        index=False,
        sep=',',  # Salva con virgola (standard)
        encoding='utf-8'
    )
    
    print(f"\n✅ File pulito creato!")
    print(f"   Nome: suar2025-01_pulito.csv")
    print(f"   Righe: {len(df_pulito)}")
    print(f"   Colonne: {len(df_pulito.columns)}")
    print(f"\n   Colonne mantenute:")
    for i, col in enumerate(df_pulito.columns, 1):
        print(f"      {i}. {col}")
    
    print(f"\n📌 Note:")
    print(f"   - File originale usava ';' come separatore")
    print(f"   - File pulito usa ',' come separatore (standard)")
    
else:
    print(f"\n❌ ERRORE: Colonna 'numeroBagni' non trovata!")

print("\n✅ Completato!")