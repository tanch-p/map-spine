(function(exports, PIXI_spine, PIXI, PIXI_core) {

    // Atlas Loader Extension
    const atlasLoaderExtension = {
        extension: PIXI_core.ExtensionType.Asset,
        loader: {
            extension: {
                type: PIXI_core.ExtensionType.LoadParser,
                priority: PIXI.LoaderParserPriority.Normal
            },
            
            // Test if the file is an atlas file
            test(url) {
                return PIXI.checkExtension(url, ".atlas");
            },
            
            // Load the atlas file
            async load(url) {
                return await (await PIXI_core.settings.ADAPTER.fetch(url)).text();
            },
            
            // Validate the parsed content
            testParse(content, resource) {
                const isAtlasExtension = PIXI.checkExtension(resource.src, ".atlas");
                const isStringContent = typeof content === "string";
                return Promise.resolve(isAtlasExtension && isStringContent);
            },
            
            // Parse the atlas file
            async parse(content, resource, loader) {
                const resourceData = resource.data;
                
                // Determine base path
                let basePath = PIXI_core.utils.path.dirname(resource.src);
                if (basePath && basePath.lastIndexOf("/") !== basePath.length - 1) {
                    basePath += "/";
                }
                
                // Promise to handle async loading
                let resolvePromise, rejectPromise;
                const atlasLoadPromise = new Promise((resolve, reject) => {
                    resolvePromise = resolve;
                    rejectPromise = reject;
                });
                
                let textureAtlas;
                
                // Error handling function
                const onError = (success) => {
                    if (!success) {
                        rejectPromise(`Failed to load spine .atlas file. 
                        Most likely texture load failed.`);
                    }
                    resolvePromise(textureAtlas);
                };
                
                // Handle image loading
                if (resourceData.image || resourceData.images) {
                    // Merge images, using 'default' as fallback
                    const images = Object.assign(
                        resourceData.image ? { default: resourceData.image } : {},
                        resourceData.images
                    );
                    
                    textureAtlas = new PIXI_spine.TextureAtlas(
                        content, 
                        (imageName, callback) => {
                            const imageSource = images[imageName] || images.default;
                            if (imageSource && imageSource.baseTexture) {
                                callback(imageSource.baseTexture);
                            } else {
                                callback(imageSource);
                            }
                        }, 
                        onError
                    );
                } else {
                    // Standard atlas loading
                    textureAtlas = new PIXI_spine.TextureAtlas(
                        content, 
                        makeSpineTextureAtlasLoaderFunction(loader, basePath, resourceData.imageMetadata), 
                        onError
                    );
                }
                
                return await atlasLoadPromise;
            },
            
            // Unload method
            unload(asset) {
                asset.dispose();
            }
        }
    };

    // Utility function to create texture atlas loader
    const makeSpineTextureAtlasLoaderFunction = (loader, basePath, imageMetadata) => 
        async (imageName, callback) => {
            const imagePath = PIXI_core.utils.path.normalize(
                [...basePath.split(PIXI_core.utils.path.sep), imageName].join(PIXI_core.utils.path.sep)
            );
            
            const loadedImage = await loader.load({
                src: imagePath,
                data: imageMetadata
            });
            
            callback(loadedImage.baseTexture);
        };

    // Helper functions to check content type
    function isSkeletonJson(content) {
        return content.hasOwnProperty("bones");
    }

    function isArrayBuffer(content) {
        return content instanceof ArrayBuffer;
    }

    // Spine Loader Abstract Class
    class SpineLoaderAbstract {
        constructor() {}

        installLoader() {
            const self = this;
            
            const skelLoaderExtension = {
                extension: PIXI_core.ExtensionType.Asset,
                loader: {
                    extension: {
                        type: PIXI_core.ExtensionType.LoadParser,
                        priority: PIXI.LoaderParserPriority.Normal
                    },
                    
                    // Test if the file is a .skel file
                    test(url) {
                        return PIXI.checkExtension(url, ".skel");
                    },
                    
                    // Load the skel file as array buffer
                    async load(url) {
                        return await (await PIXI_core.settings.ADAPTER.fetch(url)).arrayBuffer();
                    },
                    
                    // Validate the parsed content
                    testParse(content, resource) {
                        const isJsonWithBones = PIXI.checkExtension(resource.src, ".json") && 
                            isSkeletonJson(content);
                        
                        const isSkelBuffer = PIXI.checkExtension(resource.src, ".skel") && 
                            isArrayBuffer(content);
                        
                        const isAtlasDisabled = resource.data?.spineAtlas === false;
                        
                        return Promise.resolve(
                            (isJsonWithBones && !isAtlasDisabled) || isSkelBuffer
                        );
                    },
                    
                    // Parse the skeleton file
                    async parse(content, resource, loader) {
                        const fileExtension = PIXI_core.utils.path.extname(resource.src).toLowerCase();
                        const baseName = PIXI_core.utils.path.basename(resource.src, fileExtension);
                        
                        let basePath = PIXI_core.utils.path.dirname(resource.src);
                        if (basePath && basePath.lastIndexOf("/") !== basePath.length - 1) {
                            basePath += "/";
                        }
                        
                        const isJsonFormat = PIXI.checkExtension(resource.src, ".json") && 
                            isSkeletonJson(content);
                        
                        let parser = null;
                        let parsableContent = content;
                        
                        if (isJsonFormat) {
                            parser = self.createJsonParser();
                        } else {
                            parser = self.createBinaryParser();
                            parsableContent = new Uint8Array(content);
                        }
                        
                        const resourceData = resource.data || {};
                        const skeletonScale = resourceData?.spineSkeletonScale ?? null;
                        
                        if (skeletonScale) {
                            parser.scale = skeletonScale;
                        }
                        
                        const spineAtlas = resourceData.spineAtlas;
                        
                        // Multiple atlas loading scenarios
                        if (spineAtlas && spineAtlas.pages) {
                            return self.parseData(parser, spineAtlas, parsableContent);
                        }
                        
                        const atlasRawData = resourceData.atlasRawData;
                        if (atlasRawData) {
                            let resolveAtlas, rejectAtlas;
                            const atlasPromise = new Promise((resolve, reject) => {
                                resolveAtlas = resolve;
                                rejectAtlas = reject;
                            });
                            
                            const textureAtlas = new PIXI_spine.TextureAtlas(
                                atlasRawData, 
                                makeSpineTextureAtlasLoaderFunction(
                                    loader, 
                                    basePath, 
                                    resourceData.imageMetadata
                                ),
                                (success) => {
                                    if (!success) {
                                        rejectAtlas('Atlas loading failed');
                                    }
                                    resolveAtlas(textureAtlas);
                                }
                            );
                            
                            const resolvedAtlas = await atlasPromise;
                            return self.parseData(parser, resolvedAtlas, parsableContent);
                        }
                        
                        // Fallback atlas file loading
                        let atlasFile = resourceData.spineAtlasFile;
                        if (!atlasFile) {
                            atlasFile = `${basePath + baseName}.atlas`;
                        }
                        
                        const loadedAtlas = await loader.load({
                            src: atlasFile,
                            data: resourceData,
                            alias: resourceData.spineAtlasAlias
                        });
                        
                        return self.parseData(parser, loadedAtlas, parsableContent);
                    }
                }
            };
            
            PIXI_core.extensions.add(skelLoaderExtension);
            return skelLoaderExtension;
        }
    }

    // Expose the loader classes
    exports.SpineLoaderAbstract = SpineLoaderAbstract;
    exports.makeSpineTextureAtlasLoaderFunctionFromPixiLoaderObject = makeSpineTextureAtlasLoaderFunction;

    // Add the atlas loader extension
    PIXI_core.extensions.add(atlasLoaderExtension);

    return exports;
})(
    {}, 
    PIXI.spine, 
    PIXI, 
    PIXI
);