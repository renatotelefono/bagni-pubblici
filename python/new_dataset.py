import pandas as pd

# Usa raw string (r'...') oppure forward slash
df = pd.read_csv(r'C:\Users\HP\Desktop\bagni-pubblici\suar2025-01.csv')

print(f"Righe totali: {len(df)}")
print(f"Colonne totali: {len(df.columns)}")
print("\nNomi colonne:")
print(df.columns.tolist())
print("\nPrime 3 righe:")
print(df.head(3))

# Confronta con le colonne del vecchio dataset
vecchie_colonne = ['_id', 'id', 'tipologia', 'denominazione', 'via', 'civico', 'latitude', 'longitude', 'stelle', 'categoria', 'totalePostiLetto', 'totaleNumeroCamere', 'numeroSingole', 'numeroDoppie', 'numeroTriple', 'numeroQuadruple', 'numeroBagni', 'contattoCellulare', 'contattoEmail', 'contattoFacebook', 'contattoInstagram', 'contattoTelefono', 'contattoWebSite', 'contattoFax', 'contattoTwitter', 'accessibileDisabili', 'accettazioneGruppi', 'accettaAnimaliPiccolaTaglia', 'attivitaSportive', 'depositoValori', 'lavanderia', 'ristorante', 'tennis', 'parco', 'pistaBallo', 'servizioTelefono', 'televisione', 'tennisTavolo', 'ariaCondizionata', 'coperturaWifi', 'piscina', 'parcheggioCustodito', 'venditaAlimentiPropriaProduzione', 'trasportoClienti', 'bar', 'cassettaSicurezza', 'presaTelefonicaModem', 'spaccio', 'campiBocce', 'campoBeachVolley', 'campoCalcetto', 'campoPallavolo', 'attraccoNatanti', 'numeroBungalow', 'numeroDocce', 'numeroLavadini', 'numeroPiazzole']

nuove_colonne = df.columns.tolist()

print("\n" + "="*60)
print("CONFRONTO COLONNE")
print("="*60)

# Colonne mancanti nel nuovo dataset
mancanti = set(vecchie_colonne) - set(nuove_colonne)
if mancanti:
    print(f"\n❌ Colonne nel VECCHIO dataset ma NON nel NUOVO:")
    for col in sorted(mancanti):
        print(f"   - {col}")

# Colonne nuove
nuove = set(nuove_colonne) - set(vecchie_colonne)
if nuove:
    print(f"\n✨ Colonne NUOVE nel nuovo dataset:")
    for col in sorted(nuove):
        print(f"   + {col}")

# Colonne in comune
comuni = set(vecchie_colonne) & set(nuove_colonne)
print(f"\n✅ Colonne in COMUNE: {len(comuni)}/{len(vecchie_colonne)}")

if mancanti:
    print("\n⚠️  ATTENZIONE: Il nuovo dataset ha colonne diverse!")
    print("   Dovrai modificare la tabella o lo script di import")
else:
    print("\n✅ PERFETTO! Le colonne sono compatibili!")