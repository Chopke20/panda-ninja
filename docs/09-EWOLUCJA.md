# Ewolucja pand — drafty i pipeline

Data: 2026-09-07. Gałąź robocza: `paper-doll-kotwice` (zmiany produktowe).

## Decyzja produktowa

- Sklepik kosmetyczny (broń / gadżety / wzory / futro / oczy) **schowany**.
- Dziecko na onboardingu wybiera: **która panda**, **kolor kimona**, **logo**.
- Broń i gadżety = **ciągi ewolucji** (6 stadiów × 2 pandy × 4 pozy).
- Dziury na stadium 7–8 w UI („???”).

## Linie

| Body | Charakter | Ścieżka |
| --- | --- | --- |
| `round` | Panda spokojna | bokken → katana → naramiennik → plecak |
| `agile` | Panda zwinna | nunchaku (z łańcuchem) → naginata → mistrzowska pika → złota włócznia |

## Drafty do oceny (PRZED wycięciem)

Pliki w `art-qa/evo-drafts/`:

- `evo-round-01-novice.png` … `evo-round-06-legend.png`
- `evo-agile-01-novice.png` … `evo-agile-06-legend.png`

Kontaktówki:

```bash
npm run art:evo-contact
```

→ `art-qa/evo-contact-round.png`, `evo-contact-agile.png`, `evo-contact-all.png`

**Nie wycinaj poz**, dopóki kontaktówka nie dostanie OK.

## Chroma kimona (docelowo)

Generator ma malować gi na `#FF2D9B` (cień `#C41A78`). Runtime podmienia hue.
Na draftach round chroma często wraca do grafitu — do poprawy w kolejnej generacji.
Agile lepiej trzyma magenta.

Opaska **nie** jest chroma (znak postaci: A ciemna, B czerwona).

## Po akceptacji — ZROBIONE

1. ~~Ponowna generacja~~ — zaakceptowane drafty w `art-qa/evo-drafts/`
2. Wycinanie: `npm run art:evo-slice` → `public/art/evo/{body}/{01..06}/{pose}.webp`
3. `ready: true` w `src/lib/evolution.ts`
4. Recolor chroma (`src/lib/pandaChroma.ts`) + logo PNG na płytce (`PandaEvoSprite`)

Sklepik kosmetyczny zastąpiony ekranem **Awans pandy**. Onboarding: krok wyboru pandy / koloru / logo.

## Czego nie cofać

- Nie wracać do sklepiku warstw / `lockFrame` w UI.
- Nie skalować `agile` ze `round` — to osobne rysunki.
- Nie obiecywać futra / oczu w UI bez grafiki.
