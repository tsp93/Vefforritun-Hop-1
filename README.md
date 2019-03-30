# Hópverkefni 1

Útfært af einum aðila, þ.e. mér.

## Uppsetning

Það þarf að gera nokkra hluti til að setja upp verkefnið:

### NPM

Þar sem verkefnið notast við marga mismunandi npm pakka þarf fyrst og fremst þarf að keyra:
```console
npm install
```

### ENV

Setja þarf upp .env skrá með eftirfarandi gildum:

| Breyta                | Lýsing                      | Dæmi                            |
| --------------------- | --------------------------- | ------------------------------  |
| DATABASE_URL          | Url á gagnagrunn            | postgres://:@localhost/example  |
| JWT_SECRET            | Secret fyrir JSON web token | thisisasecret                   |
| JWT_TOKEN_LIFETIME    | Líftími fyrir token         | 30d (30 dagar)                  |
| CLOUDINARY_CLOUD      | Nafn á Cloudinary cloudi    | tomcat                          |
| CLOUDINARY_API_KEY    | API lykill fyrir Cloudinary | 33453438456734154               |
| CLOUDINARY_API_SECRET | Secret fyrir API lykilinn   | AS4Dgf2-jFa967SD-SjkmD3asdf     |
| FOLDER_PATH           | Path á folder á Cloudinary  | v1553806495/Vef2-Hop1/          |

Dæmi um mynd á cloudinary: http://res.cloudinary.com/tomcat/image/upload/v1553806495/Vef2-Hop1/img1.jpg

### Gagnagrunnur

Eftir að .env skráin er sett upp þarf að upphafsstilla gagnagrunn með því að keyra skipunina:
```console
npm run setup
```

## Notendur

Til að logga sig inn þarf að senda inn netfang og lykilorð. Eftirfarandi notendur eru í
gagnagrunninum eftir uppsetningu:

| Notendanafn   | Netfang               | Lykilorð         |
| ------------- | --------------------- | ---------------  |
| admin         | admin@example.org     | admin            |
| normaluser    | normalguy@goulash.com | normalpassword   |

## Heroku

Verkefnið má finna keyrandi á Heroku [hér](https://vefforritun-hop1.herokuapp.com/).