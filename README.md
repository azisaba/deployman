# Deployman

Minimal Hono server for deploying a binary payload to a configured location.

## Requirements

- Node.js 20+

## Configure

Create `config.yml` in the project root:

```yml
secret: foobar
locations:
  token: location
  foobar: /srv/server/
  file: /srv/server/some_file.txt
```

Behavior notes:
- `locations` must include the provided `token`.
- If the location path is a directory, the uploaded file is placed inside it.
- If the location path is a file, the upload writes to that file.
- If the location path does not exist, it is treated as a file path.

## Run locally

```bash
npm install
npm run dev
```

## Deploy a file

```bash
curl -X PUT \
  --data-binary @foobar.jar \
  "http://localhost:3000/deploy?secret=foobar&token=foobar&filename=foobar.jar"
```

Responses:
- `201` on success
- `401` when `secret` or `token` is invalid
- `400` when `filename` contains `/` or `\`

## Docker

Build and run:

```bash
docker build -t deployman .
docker run --rm -p 3000:3000 deployman
```

To use a host config file:

```bash
docker run --rm -p 3000:3000 -v "$PWD/config.yml:/app/config.yml" deployman
```
