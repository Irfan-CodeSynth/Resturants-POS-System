// Stand-in for the `electron` module so src/main can be imported from plain Node in tests.
// Aliased over `electron` by scripts/run-integration.mjs.
export const app = {
  getPath(name: string): string {
    const dir = process.env.POS_TEST_USER_DATA
    if (!dir) throw new Error(`POS_TEST_USER_DATA is not set (electron app.getPath('${name}'))`)
    return dir
  }
}

export const dialog = {
  async showOpenDialog(): Promise<{ canceled: boolean; filePaths: string[] }> {
    return { canceled: true, filePaths: [] }
  },
  async showSaveDialog(): Promise<{ canceled: boolean; filePath?: string }> {
    return { canceled: true }
  }
}

// Printing needs a live renderer, which a Node test never has.
export const webContents = {
  getAllWebContents(): any[] {
    return []
  }
}

export default { app, dialog, webContents }
