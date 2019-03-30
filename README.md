# Hópverkefni 1

Útfært af einum aðila, þ.e. mér. Verkefnalýsingu má finna [hér](https://github.com/vefforritun/vef2-2019-h1).

## Uppsetning

Það þarf að gera nokkra hluti til að setja upp verkefnið:

### NPM
Þar sem verkefnið notast við marga mismunandi npm pakka þarf fyrst og fremst þarf að keyra `npm install`.

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

Dæmi um mynd á cloudinary: http://res.cloudinary.com/tomcat/image/upload/v1553806495/Vef2-Hop1/img1.jpg.

### Gagnagrunnur

Eftir að .env skráin er sett upp þarf að upphafsstilla gagnagrunn með því að keyra skipunina `npm run setup`.

## Keyrsla

Keyrist með `npm start`

## Notendur

Til að logga sig inn þarf að senda inn netfang og lykilorð. Eftirfarandi notendur eru í gagnagrunninum eftir uppsetningu:

| Notendanafn   | Netfang               | Lykilorð         |
| ------------- | --------------------- | ---------------  |
| admin         | admin@example.org     | admin            |
| normaluser    | normalguy@goulash.com | normalpassword   |

## Upplýsingar um útfærslu

### Í gagnagrunn

Ef reynt er að bæta við einhverju sem er nú þegar til í töflu og brýtur gegn UNIQUE constraint þá er skilað villu. Þessi villa er svo meðhöndluð í tilsvarandi virknisskjali.

Ef einhverju er eytt er einnig eitt öllum gögnum sem vísa í að það sem var eytt. Ef stjórnandi eyðir t.d. flokk þá er öllum vörum sem tilheyra þeim flokk eytt líka.

Skema má finna í `src/database/sql/schema.sql`.

### Fjölda færslna

Ef niðurstaða getur skilað fleiri en 10 færslur einhversstaðar þá er skilað síðum. Þessar síður nota breyturnar `offset` og `limit` sem eru fengnar í gegnum query. `offset` segir til hvaða færslu á að byrja á að sýna og `limit` hversu margar færslur á að sýna.

## Köll

Eftirfarandi eru möguleg köll, svigi segir hver getur notað tilsvarandi kall: 

### Notendur
* `/users/`
  * `GET` (admin)
* `/users/register`
  * `POST` (anyone), krefst `{ username, email, password }` í body
* `/users/login`
  * `POST` (anyone), krefst `{ email, password }` í body
* `/users/me`
  * `GET` (user)
  * `PATCH` (user), krefst eitt af `{ email, password }` í body
* `/users/{id}`
  * `GET` (admin)
  * `PATCH` (admin), krefst `{ changeTo }` í body

### Flokkar
* `/categories/`
  * `GET` (anyone), mögulegt að hafa `{ offset, limit }` í query
  * `POST` (admin), krefst `{ title }` í body
* `/categories/{id}`
  * `PATCH` (admin), krefst `{ title }` í body
  * `DELETE` (admin)

### Vörur
* `/products/`
  * `GET` (anyone), mögulegt að hafa `{ offset, limit, category, search }` í query
  * `POST` (admin), krefst `{ title, description, price, imagepath, categoryId }` í body
* `/products/{id}`
  * `GET` (anyone)
  * `PATCH` (admin) krefst eitt af `{ title, description, price, imagepath, categoryId }` í body
  * `DELETE` (admin)

### Karfa
* `/cart/`
  * `GET` (user), mögulegt að hafa `{ offset, limit }` í query
  * `POST` (user), krefst `{ productId, amount }` í body
* `/cart/line/{id}`
  * `GET` (user)
  * `PATCH` (user), krefst `{ amount }` í body
  * `DELETE` (user)

### Pöntun
* `/orders/`
  * `GET` (user), mögulegt að hafa `{ offset, limit }` í query
  * `POST` (user), krefst `{ cartId, name, address }` í body
* `/orders/{id}`
  * `GET` (user), mögulegt að hafa `{ offset, limit }` í query

## Heroku

Verkefnið má finna keyrandi á Heroku [hér](https://vefforritun-hop1.herokuapp.com/).