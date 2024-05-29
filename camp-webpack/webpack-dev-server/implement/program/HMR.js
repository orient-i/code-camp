compilation.hooks.processAssets.tap(
  {
    name: PLUGIN_NAME,
    stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
  },
  () => {
    const renderManifest = compilation.getRenderManifest({
      chunk: hotUpdateChunk,
      hash: records.hash,
      fullHash: records.hash,
      outputOptions: compilation.outputOptions,
      moduleTemplates: compilation.moduleTemplates,
      dependencyTemplates: compilation.dependencyTemplates,
      codeGenerationResults: compilation.codeGenerationResults,
      runtimeTemplate: compilation.runtimeTemplate,
      moduleGraph: compilation.moduleGraph,
      chunkGraph,
    });
    for (const entry of renderManifest) {
      let filename;
      let assetInfo;
      if ("filename" in entry) {
        filename = entry.filename;
        assetInfo = entry.info;
      } else {
        ({ path: filename, info: assetInfo } = compilation.getPathWithInfo(
          entry.filenameTemplate,
          entry.pathOptions
        ));
      }
      const source = entry.render();
      compilation.additionalChunkAssets.push(filename);
      compilation.emitAsset(filename, source, {
        hotModuleReplacement: true,
        ...assetInfo,
      });
    }
    // ...
    for (const [
      filename,
      { removedChunkIds, removedModules, updatedChunkIds, assetInfo },
    ] of hotUpdateMainContentByFilename) {
      const hotUpdateMainJson = {
        c: Array.from(updatedChunkIds),
        r: Array.from(removedChunkIds),
        m:
          removedModules.size === 0
            ? completelyRemovedModulesArray
            : completelyRemovedModulesArray.concat(
                Array.from(removedModules, (m) => chunkGraph.getModuleId(m))
              ),
      };

      const source = new RawSource(JSON.stringify(hotUpdateMainJson));
      compilation.emitAsset(filename, source, {
        hotModuleReplacement: true,
        ...assetInfo,
      });
    }
  }
);
