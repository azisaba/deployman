import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import fs from 'node:fs/promises'
import path from 'node:path'
import { parse } from 'yaml'

type DeployConfig = {
  secret: string
  locations: Record<string, string>
}

const app = new Hono()
const configPath = path.resolve(process.cwd(), 'config.yml')

const loadConfig = async (): Promise<DeployConfig> => {
  const raw = await fs.readFile(configPath, 'utf8')
  const parsed = parse(raw) as DeployConfig | null
  if (!parsed || typeof parsed.secret !== 'string' || typeof parsed.locations !== 'object') {
    throw new Error('Invalid config.yml')
  }
  return parsed
}

const resolveTargetPath = async (location: string, filename: string): Promise<string> => {
  const stat = await fs.stat(location).catch(() => null)
  if (!stat) {
    return location
  }
  if (stat.isDirectory()) {
    return path.join(location, filename)
  }
  if (stat.isFile()) {
    return location
  }
  throw new Error('Location must be a file or directory')
}

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.put('/deploy', async (c) => {
  let config: DeployConfig
  try {
    config = await loadConfig()
  } catch {
    return c.text('Invalid server config', 500)
  }

  const url = new URL(c.req.url)
  const secret = url.searchParams.get('secret')
  const token = url.searchParams.get('token')
  const filename = url.searchParams.get('filename')

  if (!secret || !token || secret !== config.secret || !config.locations[token]) {
    return c.text('Unauthorized', 401)
  }

  if (!filename || filename.includes('/') || filename.includes('\\')) {
    return c.text('Invalid filename', 400)
  }

  const location = config.locations[token]
  try {
    const targetPath = await resolveTargetPath(location, filename)
    await fs.mkdir(path.dirname(targetPath), { recursive: true })

    const body = await c.req.arrayBuffer()
    await fs.writeFile(targetPath, Buffer.from(body))
  } catch {
    return c.text('Failed to deploy file', 500)
  }

  return c.text('Created', 201)
})

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
