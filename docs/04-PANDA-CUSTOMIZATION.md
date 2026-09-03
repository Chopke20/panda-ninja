# Panda Ninja 2.0 — personalizacja, sklepik i pipeline grafiki

> **STATUS: PLAN NA PRZYSZŁOŚĆ, NIE WDROŻONE.**
> Aplikacja działa dziś na płaskich arkuszach `panda-a` / `panda-b` + nakładkach.
> Cały pakiet warstwowy `panda-v2` opisany niżej to projekt na później — nie trzeba
> go czytać, żeby podmienić grafikę. Do podmiany grafiki wystarczy README, sekcja
> „Podmiana grafik”.

## Decyzja

Wdrażamy **warstwowy silnik 2D** oparty o React, CSS i transparentne PNG/WebP.

Nie wdrażamy 3D:

- aplikacja nie potrzebuje obracania postaci ani kamery;
- 3D wymagałoby nowej biblioteki, modeli, rigowania, tekstur i osobnego pipeline’u;
- byłoby cięższe dla iPada, PWA i cache offline;
- obecne ilustracje mają spójny, atrakcyjny styl 2D;
- koszt przygotowania dobrego 3D jest wielokrotnie większy niż wartość dla porannej rutyny.

Nie generujemy też pełnych obrazów każdej kombinacji. Przy 2 sylwetkach, 8 kimonach,
6 opaskach, 8 logo, 10 broniach, 12 gadżetach i 4 pozach byłoby ponad 360 tysięcy
kombinacji. Zamiast tego składamy postać z warstw.

## Co z obecną grafiką

Obecne `panda-a/*.png` i `panda-b/*.png` są pełnymi, spłaszczonymi ilustracjami:
kimono, opaska, logo, dłonie i broń znajdują się na jednym obrazie. Nie da się ich
wiarygodnie recolorować ani wymieniać elementów bez artefaktów.

Obecne pliki `public/art/items/*.png` również nie tworzą spójnego paper-doll — na części
warstw oprócz przedmiotu są fragmenty tułowia lub stroju, a ich geometria nie jest
powiązana z czterema pozami.

Dlatego:

- zachowujemy je jako fallback oraz referencję stylu dla Gemini;
- nie próbujemy automatycznie wycinać z nich wszystkich warstw;
- tworzymy nowy, kontrolowany pakiet `panda-v2` od neutralnej bazy bez broni;
- przełączamy runtime na v2 dopiero, gdy kompletny jest przynajmniej jeden body pack.

## Model renderowania

Jedna panda to stos warstw na wspólnym płótnie 512 × 512:

1. cień;
2. gadżet z tyłu;
3. tylna część broni;
4. baza futra i ciała;
5. maska koloru kimona;
6. cienie i kontury kimona;
7. maska koloru opaski;
8. cienie i kontury opaski;
9. broń z przodu;
10. dłonie zasłaniające uchwyt;
11. detal twarzy;
12. logo opaski;
13. gadżet z przodu;
14. efekt celebracji.

Cały stos jest animowany przez Framer Motion. Przy zmianie pozy dwa kompletne stosy
robią cross-fade, tak jak obecne pełne sprite’y.

### Kolory

Kimono i opaska nie potrzebują osobnego PNG dla każdego koloru:

- `*-mask.png` — biała maska alfa określająca obszar koloru;
- kolor daje element CSS z `mask-image` i `-webkit-mask-image`;
- `*-shade.png` — półprzezroczyste cienie, światła i kontury nakładane nad kolorem.

Pozwala to dodać dowolny kolor bez produkowania nowych obrazów.

### Sloty

- `hand` — jedna broń trzymana w dłoniach;
- `head` — okulary, maska, uszy, spinka;
- `back` — peleryna, plecak, kołczan;
- `belt` — sakiewka, talizman, butelka;
- `aura` — liście bambusa, iskry, chmurka;
- `headbandLogo` — znak na płytce opaski;
- `outfitPattern` — wzór nakładany na kimono.

W każdym slocie może być aktywny tylko jeden przedmiot. Przedmiot kupiony zostaje
na zawsze i można go dowolnie zakładać oraz zdejmować.

## Punkty i sklepik

Nagroda tygodniowa i sklepik to dwa oddzielne systemy:

- **postęp tygodniowy** — suma punktów z poniedziałku–niedzieli, nie wydaje się jej;
- **portfel gwiazdek** — saldo bezterminowe, z którego kupuje się kosmetyki;
- zakup nie obniża postępu do nagrody tygodniowej;
- brak losowych skrzynek, duplikatów, kar i ograniczeń czasowych;
- dziecko może wszystko bezpłatnie przymierzyć;
- zakup tworzy prośbę zatwierdzaną przez rodzica PIN-em;
- zatwierdzony zakup można zwrócić przez 24 godziny, również za PIN-em;
- przedmioty wyłącznie kosmetyczne — nic nie zwiększa punktów.

### Rejestr transakcji

`totalPoints` nie może być jedynym źródłem prawdy. Dodajemy:

```ts
type PointTransaction = {
  id: string;
  kidId: string;
  kind: 'opening-balance' | 'earn' | 'purchase' | 'refund' | 'adjustment';
  amount: number;
  itemId: string | null;
  dayLogKey: string | null;
  createdAt: string;
};
```

Saldo jest sumą transakcji. Przy migracji dotychczasowe `totalPoints` staje się jedną
transakcją `opening-balance`. `Kid.totalPoints` może zostać jako cache, ale ledger jest
źródłem prawdy.

### Punkty dzisiejsze są prowizoryczne

Wynik bieżącego dnia może się zmienić po przytrzymaniu i odznaczeniu zadania. Dlatego:

- sklep pokazuje „Sakiewka” — punkty już zaksięgowane i możliwe do wydania;
- osobno pokazuje „Dziś zdobyte” — punkty prowizoryczne;
- punkty dnia trafiają do sakiewki przy rozpoczęciu następnego dnia;
- jeden dzień może utworzyć tylko jedną transakcję `earn`, identyfikowaną przez
  `dayLogKey`;
- sklep jest ukryty podczas aktywnej rutyny, żeby nie odciągał od zadań.

### Prośba o zakup

```ts
type PurchaseRequest = {
  id: string;
  kidId: string;
  itemId: string;
  priceSnapshot: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired';
  createdAt: string;
  expiresAt: string;
};
```

Przebieg:

1. dziecko wybiera „Przymierz”;
2. naciska „Poproś o zakup”;
3. cena zostaje zarezerwowana, żeby nie wysłać kilku próśb ponad saldo;
4. rodzic wpisuje PIN i widzi cenę oraz saldo po zakupie;
5. zatwierdzenie atomowo tworzy transakcję `purchase` i nadaje własność;
6. odrzucenie zwalnia rezerwację bez komunikatu kary;
7. prośba wygasa po 48 godzinach, ale sam przedmiot nie jest ofertą limitowaną.

W interfejsie dziecięcym używamy nazwy **„Sprzęt treningowy”**, nie „Broń”.

## Wygląd bazowy pandy

Parametry bezpłatne, dostępne od początku:

- sylwetka: `okrągła`, `zwinna`;
- futro: `klasyczne`, `śnieżne`, `bambusowe`;
- plamy wokół oczu: `klasyczne`, `okrągłe`, `błyskawica`, `maska`;
- kolor kimona: 6 kolorów podstawowych;
- kolor opaski: 6 kolorów podstawowych;
- logo startowe: łapa lub bambus.

Sylwetka jest osobnym pakietem warstw na wszystkie cztery pozy. Plamy futra i logo są
małymi nakładkami. Nie sprzedajemy podstawowego wyglądu dziecka — płatne są dodatkowe
wzory, kolory premium, bronie i gadżety.

Przy migracji wszystkie elementy, które dziecko ma obecnie wybrane w `PandaConfig`,
zostają automatycznie oznaczone jako posiadane. Nie zamykamy dotychczas dostępnego
wyglądu za nową ceną.

## Katalog startowy i ceny

Maksimum przy siedmiu zadaniach to około 155 punktów dziennie. Typowy tydzień daje
około 450–700 punktów. Ceny mają dawać szybki pierwszy zakup i dłuższe cele.

### Logo opaski

| Przedmiot | Cena |
|---|---:|
| Łapa pandy | startowe |
| Bambus | startowe |
| Góra dojo | 120 |
| Fala | 160 |
| Księżyc | 220 |
| Błyskawica | 280 |
| Smok | 500 |
| Złota gwiazda | 650 |

### Bronie treningowe

| Przedmiot | Cena |
|---|---:|
| Bambusowy kij bo | startowy |
| Dwa bambusowe pałeczki | 220 |
| Drewniany miecz bokken | 320 |
| Wachlarz ninja | 380 |
| Piankowe nunchaku | 450 |
| Podwójne sai treningowe | 520 |
| Kostur smoka | 700 |
| Księżycowa naginata treningowa | 850 |
| Złoty kij mistrza | 1200 |

### Gadżety

| Przedmiot | Slot | Cena |
|---|---|---:|
| Talizman szczęścia | belt | 140 |
| Mini butelka bambusowa | belt | 180 |
| Sakiewka ninja | belt | 220 |
| Czerwona chusta | head | 260 |
| Okrągłe okulary mistrza | head | 320 |
| Maska cienia | head | 420 |
| Mały plecak dojo | back | 300 |
| Peleryna nocnego ninja | back | 550 |
| Plecak smoka | back | 750 |
| Liście bambusa | aura | 380 |
| Chmurka treningu | aura | 500 |
| Złote iskry | aura | 800 |

### Kimona i wzory premium

| Przedmiot | Cena |
|---|---:|
| Wzór bambusowy | 250 |
| Wzór fal | 350 |
| Wzór gór | 450 |
| Nocne gwiazdy | 600 |
| Smocze łuski | 850 |
| Złote obszycie mistrza | 1100 |

## Widoczna nagroda tygodniowa

Na ekranie głównym, bez wchodzenia do podsumowania:

- pod osią czasu znajduje się `WeeklyGoalBar`;
- pokazuje nazwę nagrody i osobny postęp każdego dziecka;
- po osiągnięciu progu tekst zmienia się na „Nagroda zdobyta!”;
- rodzic w panelu oznacza ją jako „zrealizowana”;
- realizacja nagrody nie wydaje gwiazdek ze sklepiku;
- brak porównania wartości punktowych między dziećmi — dwa osobne paski lub dwa znaki
  postępu, bez wskazywania zwycięzcy.

## Manifest assetów

```ts
type CosmeticSlot = 'hand' | 'head' | 'back' | 'belt' | 'aura' | 'headbandLogo' | 'outfitPattern';
type RenderMode = 'anchored' | 'pose-set';

type CosmeticItem = {
  id: string;
  label: string;
  slot: CosmeticSlot;
  price: number;
  renderMode: RenderMode;
  assetKey: string;
  defaultOwned: boolean;
};

type PoseAnchors = {
  hand: { x: number; y: number; scale: number; rotation: number };
  head: { x: number; y: number; scale: number; rotation: number };
  back: { x: number; y: number; scale: number; rotation: number };
  belt: { x: number; y: number; scale: number; rotation: number };
  headbandLogo: { x: number; y: number; scale: number; rotation: number };
};
```

Bronie używają `pose-set`, ponieważ chwyt i zasłanianie dłoni zmieniają się w każdej
pozie. Małe logo i proste gadżety używają `anchored`, czyli jednego obrazka obracanego
i skalowanego według kotwicy pozy.

## Struktura plików

```text
public/art/panda-v2/
  manifest.json
  bodies/
    round/{pose}/fur.webp
    round/{pose}/hands-front.webp
    agile/{pose}/fur.webp
    agile/{pose}/hands-front.webp
  masks/
    round/{pose}/outfit-mask.webp
    round/{pose}/outfit-shade.webp
    round/{pose}/headband-mask.webp
    round/{pose}/headband-shade.webp
  face-marks/{mark}/{pose}.webp
  logos/{logo}.webp
  weapons/{weapon}/{pose}-back.webp
  weapons/{weapon}/{pose}-front.webp
  gadgets/{item}/{pose}.webp
  previews/{item}.webp
```

`pose` to: `sleeping`, `training`, `hurry`, `celebrating`.

## Pipeline produkcyjny

1. Zatwierdzić jeden pakiet bazowy czterech póz bez broni.
2. Zapisać szablon 2 × 2 z niezmiennym kadrem i kotwicami.
3. Wygenerować warstwy bazowe dla jednej sylwetki.
4. Automatycznie pociąć i znormalizować je do 512 × 512.
5. Zbudować podgląd kontrolny nakładający wszystkie warstwy.
6. Dopiero po przejściu walidacji generować bronie i gadżety.
7. Każdy przedmiot dostarcza też miniaturę sklepową 128 × 128.
8. Build ma odrzucać paczkę z brakującą pozą, złym rozmiarem lub nieznanym ID.
9. Runtime preładuje tylko wyposażone elementy i miniatury widocznej strony sklepu.
10. Obecne pełne sprite’y zostają fallbackiem do czasu ukończenia całej migracji.

## Prompt bazowy dla Gemini — pakiet pozy

Do promptu należy dołączyć obecne obrazy pandy jako referencję stylu.

```text
Stwórz produkcyjny arkusz warstwowej postaci 2D do dziecięcej aplikacji „Panda Ninja”.

REFERENCJA:
Użyj załączonej pandy jako ścisłej referencji stylu, proporcji, grubości konturów,
palety, sposobu cieniowania i wyglądu twarzy. To ma być dokładnie ta sama postać,
nie nowa interpretacja.

FORMAT:
- jeden kwadratowy obraz 2048 × 2048 px;
- siatka 2 × 2, cztery równe pola 1024 × 1024 px;
- kolejność: lewy-górny SLEEPING, prawy-górny TRAINING,
  lewy-dolny HURRY, prawy-dolny CELEBRATING;
- tło każdego pola dokładnie #F2F2F2, jednolite, bez tekstury;
- postać wyśrodkowana poziomo i ustawiona na wspólnej linii podłoża;
- co najmniej 8% pustego marginesu z każdej strony;
- nic nie może być ucięte ani wychodzić do sąsiedniego pola;
- bez napisów, etykiet, ramek, paneli i znaków wodnych.

POSTAĆ:
- sympatyczna panda ninja dla dzieci 6–8 lat;
- czytelny ciemny kontur, miękkie cel-shading, estetyka wysokiej jakości ilustracji 2D;
- identyczna głowa, uszy, plamy wokół oczu, pyszczek i proporcje w każdym polu;
- neutralne jasnoszare kimono przeznaczone do późniejszego kolorowania;
- neutralna jasnoszara opaska z pustą metalową płytką bez logo;
- żadnej broni i żadnych gadżetów;
- dłonie muszą być czytelne i ustawione tak, aby później można było dodać broń.

POZY:
- SLEEPING: panda siedzi spokojnie, oczy zamknięte, dłonie odpoczywają;
- TRAINING: stabilna pozycja bojowa, obie dłonie tworzą naturalny chwyt na niewidzialnym kiju;
- HURRY: ta sama konstrukcja chwytu co TRAINING, bardziej dynamiczne ugięcie nóg;
- CELEBRATING: radosny skok, jedna lub obie dłonie gotowe utrzymać przedmiot nad głową,
  bez konfetti i bez gwiazdek — efekty zostaną dodane w aplikacji.

KRYTYCZNE:
To jest asset do warstwowego systemu paper-doll. Zachowaj identyczny rozmiar głowy,
pozycję twarzy i konstrukcję stroju między wariantami. Nie dodawaj żadnych elementów,
o które nie poproszono.
```

## Prompt Gemini — broń jako zestaw czterech póz

```text
Na podstawie załączonego zatwierdzonego arkusza pozy Panda Ninja przygotuj warstwę
przedmiotu: [NAZWA PRZEDMIOTU].

Wynik ma mieć dokładnie ten sam format 2048 × 2048 i tę samą siatkę 2 × 2.
Nie rysuj pandy, kimona, opaski, twarzy, dłoni, cienia podłoża ani efektów.
Narysuj wyłącznie przedmiot w dokładnym miejscu i kącie potrzebnym dla dłoni pandy
w odpowiadającej pozie. Zachowaj identyczne kadrowanie i współrzędne względem
arkusza referencyjnego.

Tło dokładnie #F2F2F2. Przedmiot ma być przyjazny dzieciom, treningowy i stylizowany,
bez ostrej przemocy. Zachowaj kontur, paletę i cel-shading z referencji.

Kolejność pól:
1. SLEEPING — przedmiot bezpiecznie odłożony obok pandy;
2. TRAINING — przedmiot w naturalnym chwycie;
3. HURRY — dynamiczny chwyt;
4. CELEBRATING — przedmiot uniesiony w geście radości.

Nie przesuwaj, nie skaluj ani nie zmieniaj siatki. Bez tekstu, ramek i znaków wodnych.
```

## Prompt Gemini — logo opaski

```text
Stwórz zestaw 8 prostych symboli na metalową płytkę opaski Panda Ninja:
łapa pandy, bambus, góra dojo, fala, księżyc, błyskawica, smok, złota gwiazda.

Arkusz 4 × 2, 2048 × 1024 px, każde pole 512 × 512 px. Każdy symbol osobno,
wyśrodkowany, frontalny, bez perspektywy i bez samej opaski. Gruby czytelny kontur,
proste kształty rozpoznawalne przy rozmiarze 24 px, styl zgodny z załączoną pandą.
Tło dokładnie #F2F2F2. Bez tekstu, ramek i znaków wodnych.
```

## Fazy wdrożenia

### Faza A — fundament

- nowy model `PandaAppearance`, `Inventory`, `PointTransaction`;
- migracja istniejących dzieci i salda;
- katalog przedmiotów jako dane, bez JSX;
- manifest assetów i walidator paczki;
- `PandaComposer` z fallbackiem do obecnego `PandaStage`.

### Faza B — bezpłatny edytor wyglądu

- sylwetka, futro, plamy twarzy;
- kolor kimona i opaski;
- wybór logo;
- duży podgląd na żywo czterech póz;
- zapis wyposażenia per dziecko.

### Faza C — sklepik

- ekran katalogu z kategoriami;
- saldo zaksięgowane, punkty prowizoryczne i historia transakcji;
- prośby o zakup, rezerwacje i zatwierdzenie PIN-em;
- zwrot przez 24 godziny;
- szafa „Moje przedmioty”;
- wyposażenie przedmiotu po zakupie.

### Faza D — nagroda tygodniowa

- stały `WeeklyGoalBar` na ekranie głównym;
- status zdobycia i realizacji;
- osobna historia nagród;
- brak wpływu zakupów na postęp tygodniowy.

### Faza E — rozszerzenie paczki

- kolejne bronie i gadżety;
- wzory kimon i efekty aura;
- drugi pakiet sylwetki;
- walidacja wydajności i cache offline na docelowym iPadzie.
