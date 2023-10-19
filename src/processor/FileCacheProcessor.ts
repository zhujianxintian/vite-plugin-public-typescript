import path from 'node:path'
import fs from 'fs-extra'
import { normalizePath } from 'vite'
import createDebug from 'debug'
import { findAllOldJsFile, writeFile } from '../helper/utils'
import { assert } from '../helper/assert'
import { globalConfig } from '../global-config'
import { type ManifestCache } from '../manifest-cache/ManifestCache'
import { type CacheValueEx } from '../manifest-cache'
import { type AddFileArgs, type DeleteFileArgs, ManifestCacheProcessor } from './ManifestCacheProcessor'

const debug = createDebug('FileCacheProcessor ===> ')

// file-based processor
// the final output dir is base on `publicDir`
export class FileCacheProcessor extends ManifestCacheProcessor {
  constructor(manifestCache: ManifestCache<CacheValueEx>) {
    super(manifestCache)
    this.manifestCache = manifestCache
  }

  async deleteOldJs(args: DeleteFileArgs): Promise<void> {
    const { originFileName, compiledFileName = '', silent } = args

    const {
      outputDir,
      viteConfig: { publicDir },
    } = globalConfig.get()

    let oldFiles: string[] = []
    try {
      fs.ensureDirSync(path.join(publicDir, outputDir))
      oldFiles = await findAllOldJsFile({
        originFilesName: [originFileName],
        outputDir,
        publicDir,
      })
    } catch (error) {
      console.error(error)
    }

    debug('deleteOldJsFile - oldFiles:', oldFiles)

    assert(Array.isArray(oldFiles))

    debug('manifestCache:', this.manifestCache.get())

    if (oldFiles.length > 0) {
      for (const f of oldFiles) {
        if (path.parse(f).name === compiledFileName) {
          debug('deleteOldJsFile - skip file:', compiledFileName)
          continue
        } // skip repeat js file
        if (fs.existsSync(f)) {
          debug('deleteOldJsFile - file exists:', f, originFileName)
          this.manifestCache.remove(originFileName, { silent })
          debug('deleteOldJsFile - manifestCache removed:', originFileName)
          fs.remove(f)
          debug('deleteOldJsFile -file removed:', f)
        }
      }
    } else {
      this.manifestCache.remove(originFileName, { silent })
      debug('manifestCache removed:', originFileName)
    }
  }

  async addNewJs(args: AddFileArgs): Promise<void> {
    const { code = '' } = args
    const {
      viteConfig: { publicDir },
    } = globalConfig.get()

    const pathToDisk = this.setCache(args, globalConfig.get())

    const jsFilePath = normalizePath(path.join(publicDir, pathToDisk))

    fs.ensureDirSync(path.dirname(jsFilePath))

    writeFile(jsFilePath, code)
  }
}