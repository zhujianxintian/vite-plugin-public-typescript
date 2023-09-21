import { globalConfig } from '../global-config'
import type { CacheValueEx } from '../manifest-cache'
import type { ManifestCache } from '../manifest-cache//ManifestCache'
import { ManifestCacheProcessor } from './ManifestCacheProcessor'
import type { AddFileArgs, DeleteFileArgs } from './ManifestCacheProcessor'

export class MemoryCacheProcessor extends ManifestCacheProcessor {
  constructor(manifestCache: ManifestCache<CacheValueEx>) {
    super(manifestCache)
  }

  async deleteOldJs(args: DeleteFileArgs): Promise<void> {
    const { originFileName, silent } = args
    this.manifestCache.remove(originFileName, { silent })
  }

  async addNewJs(args: AddFileArgs): Promise<void> {
    this.setCache(args, globalConfig.get())
  }
}
