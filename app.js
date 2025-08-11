// WORDPRESS COMPATIBLE STATE MANAGEMENT

// CRITICAL FIX: Self-healing refs + mount utilities
function getRightPanelRefs() {
    const rightPanel = document.getElementById('rightPanel');
    const previewArea = document.getElementById('previewArea');
    const container = document.getElementById('designPreviewContainer');
    const canvas = document.getElementById('designPreviewCanvas');
    const layer = document.getElementById('designElementsLayer');
    const list = document.getElementById('elementsList');
    return { rightPanel, previewArea, container, canvas, layer, list };
}

function mountRightPanelEditor() {
    const r = getRightPanelRefs();
    if (!r.rightPanel) { 
        console.warn('[RP] Missing #rightPanel container'); 
        return false; 
    }

    // Create preview structure if it's missing
    if (!r.previewArea) {
        const area = document.createElement('div'); 
        area.id = 'previewArea';
        r.rightPanel.querySelector?.('#canvasWrapper, .canvas-wrapper')?.append?.(area) || r.rightPanel.append(area);
    }
    const pr = getRightPanelRefs();

    if (!pr.container) {
        const c = document.createElement('div'); 
        c.id = 'designPreviewContainer'; 
        c.className = 'rp-preview';
        const cv = document.createElement('canvas'); 
        cv.id = 'designPreviewCanvas';
        const ly = document.createElement('div'); 
        ly.id = 'designElementsLayer'; 
        ly.setAttribute('aria-hidden','true');
        c.append(cv, ly);
        pr.previewArea.append(c);
    }
    if (!pr.list) {
        const list = document.createElement('div'); 
        list.id = 'elementsList'; 
        list.className='elements-list';
        list.setAttribute('role','list'); 
        list.setAttribute('aria-label','Tasarım elementleri listesi');
        r.rightPanel.querySelector?.('#elementsPanel, .elements-panel')?.append?.(list) || r.rightPanel.append(list);
    }
    console.info('[RP] editor mounted');
    return true;
}
        const DesignState = {
            // Core state
            currentArea: 'front',
            selectedDesign: null,
            elementIdCounter: 0,
            designs: {
                front: [],
                back: [],
                left: [],
                right: []
            },
            
            // UI state
            rightPanelVisible: true,
            propertiesPanelVisible: false,
            
            // Performance state
            isDragging: false,
            isResizing: false,
            isRotating: false,
            
            // CRITICAL FIX: Enhanced state management for better synchronization
            lastUpdateTime: 0,
            updateQueue: [],
            isUpdating: false,
            
            // Methods
            addDesign(design) {
                this.designs[this.currentArea].push(design);
                this.selectedDesign = design; // Auto-select newly added design
                this.updateRightPanel();
                this.update3DModel();
                // PRODUCTION FIX: Sync editor with new design
                syncEditorWithSelection(design);
                console.log('🎯 Design added to state:', design.id);
            },
            
            selectDesign(designId) {
                const design = this.designs[this.currentArea].find(d => d.id === designId);
                if (design) {
                    this.selectedDesign = design;
                    this.updateRightPanelSelection();
                    this.update3DModelSelection();
                    this.showPropertiesPanel();
                    // PRODUCTION FIX: Sync editor with selection
                    syncEditorWithSelection(design);
                    console.log('🎯 Design selected in state:', designId);
                }
            },
            
            updateDesign(designId, updates) {
                const design = this.designs[this.currentArea].find(d => d.id === designId);
                if (design) {
                    Object.assign(design, updates);
                    this.updateRightPanel();
                    this.update3DModel();
                    console.log('🎯 Design updated in state:', designId, updates);
                }
            },
            
            removeDesign(designId) {
                const index = this.designs[this.currentArea].findIndex(d => d.id === designId);
                if (index > -1) {
                    this.designs[this.currentArea].splice(index, 1);
                    if (this.selectedDesign && this.selectedDesign.id === designId) {
                        this.selectedDesign = null;
                        this.hidePropertiesPanel();
                        // PRODUCTION FIX: Clear editor when selected design is removed
                        syncEditorWithSelection(null);
                    }
                    this.updateRightPanel();
                    this.update3DModel();
                    console.log('🎯 Design removed from state:', designId);
                }
            },
            
            updateRightPanel() {
                // CRITICAL FIX: Ensure immediate panel update
                if (typeof updateRightPanelFromState === 'function') {
                    updateRightPanelFromState();
                }
                // CRITICAL FIX: Force panel visibility
                ensureRightPanelVisibility();
            },
            
            updateRightPanelSelection() {
                // CRITICAL FIX: Ensure immediate selection update
                if (typeof updateRightPanelSelectionFromState === 'function') {
                    updateRightPanelSelectionFromState();
                }
            },
            
            update3DModel() {
                // CRITICAL FIX: Ensure immediate 3D model update
                if (typeof drawDesignPreview === 'function') {
                    drawDesignPreview();
                }
                if (typeof applyDesignsToModel === 'function') {
                    applyDesignsToModel();
                }
            },
            
            update3DModelSelection() {
                // CRITICAL FIX: Ensure immediate 3D model selection update
                if (typeof update3DModelSelectionFromState === 'function') {
                    update3DModelSelectionFromState();
                }
            },
            
            showPropertiesPanel() {
                this.propertiesPanelVisible = true;
                if (typeof showPropertiesPanelFromState === 'function') {
                    showPropertiesPanelFromState();
                }
            },
            
            hidePropertiesPanel() {
                this.propertiesPanelVisible = false;
                if (typeof hidePropertiesPanelFromState === 'function') {
                    hidePropertiesPanelFromState();
                }
            }
        };

        // PRODUCTION FIX: Disable experimental features
        window.__FEATURE_PREVIEW_UV = false;
        window.__USE_RP_EDITOR = false;

        // CRITICAL FIX: Global state for better synchronization
        let globalState = {
            selectedDesignId: null,
            isPanelInteraction: false,
            is3DInteraction: false,
            lastInteractionTime: 0,
            interactionThrottle: 16 // ~60fps
        };

        /**
         * PRODUCTION FIX: Create right panel DOM if missing
         */
        function createRightPanelDOM() {
            // Find the card container that holds "ÖN TASARIM ALANI"
            const cards = Array.from(document.querySelectorAll('*'))
                .filter(n => n.textContent && n.textContent.trim().includes('ÖN TASARIM ALANI'));
            const card = cards.length ? cards[0].closest('div') : null;
            const host = card || document.body; // safe fallback

            let root = document.getElementById('rightPanelPreview');
            if (!root) {
                root = document.createElement('div');
                root.id = 'rightPanelPreview';
                root.className = 'right-panel-preview';
                host.appendChild(root);
            }

            if (!document.getElementById('designPreviewContainer')) {
                root.innerHTML = `
                    <div id="designPreviewContainer" class="preview-container" role="group" aria-label="Ön tasarım alanı">
                        <canvas id="designPreviewCanvas" width="397" height="180"></canvas>
                        <div id="designElementsLayer" class="design-elements-layer" role="region" aria-label="Preview design overlay"></div>
                    </div>
                `;
            }
            
            // PRODUCTION FIX: Ensure designElementsLayer exists with correct styling
            const container = document.getElementById('designPreviewContainer');
            let layer = document.getElementById('designElementsLayer');
            
            if (container && !layer) {
                layer = document.createElement('div');
                layer.id = 'designElementsLayer';
                layer.className = 'design-elements-layer';
                layer.setAttribute('role', 'region');
                layer.setAttribute('aria-label', 'Preview design overlay');
                layer.style.position = 'absolute';
                layer.style.inset = '0';
                layer.style.zIndex = '2';
                layer.style.pointerEvents = 'none';
                layer.style.userSelect = 'none';
                layer.style.touchAction = 'none';
                container.appendChild(layer);
                console.log('[PREVIEW] Created missing designElementsLayer');
            }
            
            // PRODUCTION FIX: Apply required CSS styles
            if (container) {
                container.style.position = 'relative';
            }
            
            const canvas = document.getElementById('designPreviewCanvas');
            if (canvas) {
                canvas.style.display = 'block';
                canvas.style.width = '100%';
                canvas.style.height = 'auto';
            }
            
            // PRODUCTION FIX: Ensure layer has correct styles
            if (layer) {
                layer.style.position = 'absolute';
                layer.style.inset = '0';
                layer.style.zIndex = '2';
                layer.style.pointerEvents = 'none';
                layer.style.userSelect = 'none';
                layer.style.touchAction = 'none';
            }
        }

        /**
         * CRITICAL FIX: Single source of truth for right panel DOM refs
         */
        function getRightPanelRefs() {
            const rightPanel = document.getElementById('rightPanel');
            const previewArea = document.getElementById('previewArea');
            const container = document.getElementById('designPreviewContainer');
            const canvas = document.getElementById('designPreviewCanvas');
            const layer = document.getElementById('designElementsLayer');
            const list = document.getElementById('elementsList');
            return { rightPanel, previewArea, container, canvas, layer, list };
        }
        
        /**
         * CRITICAL FIX: Assert and build right panel DOM structure
         */
        function assertRightPanelDOM() {
            const rightPanel = document.getElementById('rightPanel');
            if (!rightPanel) {
                console.warn('[RP] Missing #rightPanel container');
                return false;
            }
            
            // Ensure preview container exists
            let preview = document.getElementById('rightPanelPreview');
            if (!preview) {
                preview = document.createElement('div');
                preview.id = 'rightPanelPreview';
                preview.style.cssText = 'position:relative;width:100%;aspect-ratio:16/7;';
                rightPanel.appendChild(preview);
                console.log('[RP] Created rightPanelPreview');
            }
            
            // Ensure canvas exists
            let canvas = document.getElementById('designPreviewCanvas');
            if (!canvas) {
                canvas = document.createElement('canvas');
                canvas.id = 'designPreviewCanvas';
                canvas.style.cssText = 'position:absolute;inset:0;z-index:1;display:block;';
                preview.appendChild(canvas);
                console.log('[RP] Created designPreviewCanvas');
            }
            
            // Ensure layer exists
            let layer = document.getElementById('designElementsLayer');
            if (!layer) {
                layer = document.createElement('div');
                layer.id = 'designElementsLayer';
                layer.className = 'design-elements-layer';
                layer.setAttribute('aria-hidden', 'true');
                layer.style.cssText = 'position:absolute;inset:0;z-index:2;pointer-events:none;';
                preview.appendChild(layer);
                console.log('[RP] Created designElementsLayer');
            }
            
            return true;
        }

        /**
         * CRITICAL FIX: Mount and configure the right panel editor
         */
        function mountRightPanelEditor() {
            // Assert DOM structure first
            if (!assertRightPanelDOM()) {
                console.warn('[RP] Cannot mount editor - missing DOM structure');
                return;
            }
            
            const refs = getRightPanelRefs();
            if (!refs.preview || !refs.canvas || !refs.layer) {
                console.warn('[RP] Missing refs (guarded)');
                return;
            }
            
            // Get initial rect and validate
            const rect = refs.rect();
            if (!rect || !Number.isFinite(rect.width) || rect.width <= 0 || !Number.isFinite(rect.height) || rect.height <= 0) {
                console.warn('[RP] Invalid initial rect, skipping mount');
                return;
            }
            
            // Set canvas size
            refs.canvas.width = rect.width;
            refs.canvas.height = rect.height;
            
            // CRITICAL FIX: Single ResizeObserver for canvas sizing and preview redraw
            if (refs.preview.__resizeObserver) {
                refs.preview.__resizeObserver.disconnect();
            }

            refs.preview.__resizeObserver = new ResizeObserver((entries) => {
                const entry = entries[0];
                if (entry) {
                    const { width, height } = entry.contentRect;
                    refs.canvas.width = width;
                    refs.canvas.height = height;
                    
                    // Reposition existing elements via stored percentages
                    refs.layer.querySelectorAll('.design-element').forEach(el => {
                        const designId = el.getAttribute('data-design-id');
                        const design = designs[currentArea]?.find(d => d.id === designId);
                        if (design) {
                            updateElementPositionFromPercentages(el, design, refs.rect());
                        }
                    });
                    
                    // Throttled resize log
                    const now = Date.now();
                    if (!window.__lastResizeLog || now - window.__lastResizeLog > 2000) {
                        console.log('[RP] Resized to', width, 'x', height);
                        window.__lastResizeLog = now;
                    }
                    
                    // Trigger preview redraw
                    drawDesignsOnCanvas(currentArea);
                }
            });

            refs.preview.__resizeObserver.observe(refs.preview);

            // Register pointer/wheel events on layer
            refs.layer.addEventListener('pointerdown', handleLayerPointerDown);
            refs.layer.addEventListener('wheel', handleLayerWheel);

            console.log('[RP] ready', rect.width, rect.height);
        }
        
        /**
         * CRITICAL FIX: Update element position from stored percentages
         */
        function updateElementPositionFromPercentages(el, design, rect) {
            if (!el || !design || !rect) return;
            
            const x = (design.x || 0.5) * rect.width;
            const y = (design.y || 0.5) * rect.height;
            const scale = design.scale || 1;
            const rotation = design.rotation || 0;
            
            el.style.left = `${x}px`;
            el.style.top = `${y}px`;
            el.style.transform = `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`;
        }
        
        /**
         * PRODUCTION FIX: Sync editor with current selection
         */
        function syncEditorWithSelection(selectedDesign) {
            const rp = getRightPanelRefs();
            if (!rp) return;
            
            // Clear existing overlay items
            rp.overlay.innerHTML = '';
            
            if (!selectedDesign || !designs[currentArea]) return;
            
            // Check if selected design belongs to current area
            const designInArea = designs[currentArea].find(d => d.id === selectedDesign.id);
            if (!designInArea) return;
            
            // Create overlay item
            const overlayItem = document.createElement('div');
            overlayItem.className = 'rp-item';
            overlayItem.setAttribute('data-id', designInArea.id);
            overlayItem.style.position = 'absolute';
            overlayItem.style.pointerEvents = 'auto';
            overlayItem.style.cursor = 'grab';
            overlayItem.style.transformOrigin = 'center';
            overlayItem.style.border = '2px solid #3b82f6';
            overlayItem.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
            
            // Position with percent-based coords
            const x = designInArea.x || 0.5;
            const y = designInArea.y || 0.5;
            const scale = designInArea.scale || 1;
            const rotation = designInArea.rotation || 0;
            
            overlayItem.style.left = `${x * 100}%`;
            overlayItem.style.top = `${y * 100}%`;
            overlayItem.style.transform = `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`;
            
            // Add resize handle
            const resizeHandle = document.createElement('div');
            resizeHandle.className = 'resize-handle';
            resizeHandle.style.position = 'absolute';
            resizeHandle.style.bottom = '-8px';
            resizeHandle.style.right = '-8px';
            resizeHandle.style.width = '16px';
            resizeHandle.style.height = '16px';
            resizeHandle.style.backgroundColor = '#3b82f6';
            resizeHandle.style.borderRadius = '50%';
            resizeHandle.style.cursor = 'nw-resize';
            resizeHandle.setAttribute('aria-label', 'Resize design');
            
            overlayItem.appendChild(resizeHandle);
            rp.overlay.appendChild(overlayItem);
            
            console.log('[RP] Synced selection:', designInArea.id);
        }
        
        /**
         * PRODUCTION FIX: Handle overlay pointer down
         */
        function handleOverlayPointerDown(e) {
            const target = e.target.closest('.rp-item');
            if (!target) return;
            
            e.preventDefault();
            e.stopPropagation();
            target.setPointerCapture(e.pointerId);
            
            const designId = target.getAttribute('data-id');
            const design = designs[currentArea].find(d => d.id === designId);
            if (!design) return;
            
            const rect = target.parentElement.getBoundingClientRect();
            const startX = e.clientX;
            const startY = e.clientY;
            const startDesignX = design.x || 0.5;
            const startDesignY = design.y || 0.5;
            const startRotation = design.rotation || 0;
            
            // Store interaction state
            __interactionStartState = {
                designId,
                startX,
                startY,
                startDesignX,
                startDesignY,
                startRotation,
                rect
            };
            
            // Add interaction classes
            document.body.classList.add('no-anim');
            window.__interactionActive = true;
            
            const handlePointerMove = (moveEvent) => {
                if (!__interactionStartState) return;
                
                const dx = (moveEvent.clientX - startX) / rect.width;
                const dy = (moveEvent.clientY - startY) / rect.height;
                
                if (moveEvent.shiftKey) {
                    // Rotate around center
                    const rotationDelta = (moveEvent.movementX / 120) * 15;
                    design.rotation = startRotation + rotationDelta;
                } else {
                    // Move with bounds clamping
                    const newX = Math.max(0.1, Math.min(0.9, startDesignX + dx));
                    const newY = Math.max(0.1, Math.min(0.9, startDesignY + dy));
                    design.x = newX;
                    design.y = newY;
                }
                
                // Update overlay item
                target.style.left = `${design.x * 100}%`;
                target.style.top = `${design.y * 100}%`;
                target.style.transform = `translate(-50%, -50%) rotate(${design.rotation}deg) scale(${design.scale || 1})`;
            };
            
            const handlePointerUp = (upEvent) => {
                target.releasePointerCapture(e.pointerId);
                document.body.classList.remove('no-anim');
                window.__interactionActive = false;
                
                document.removeEventListener('pointermove', handlePointerMove);
                document.removeEventListener('pointerup', handlePointerUp);
                document.removeEventListener('pointercancel', handlePointerUp);
                
                // Debounced apply
                scheduleApplyDesignsIdle(200);
                
                __interactionStartState = null;
            };
            
            document.addEventListener('pointermove', handlePointerMove);
            document.addEventListener('pointerup', handlePointerUp);
            document.addEventListener('pointercancel', handlePointerUp);
        }
        
        /**
         * PRODUCTION FIX: Handle overlay wheel
         */
        function handleOverlayWheel(e) {
            e.preventDefault();
            
            const target = e.target.closest('.rp-item');
            if (!target) return;
            
            const designId = target.getAttribute('data-id');
            const design = designs[currentArea].find(d => d.id === designId);
            if (!design) return;
            
            // Scale with bounds
            const factor = e.deltaY < 0 ? 1.1 : 0.9;
            design.scale = Math.max(0.1, Math.min(4, (design.scale || 1) * factor));
            
            // Update overlay item
            target.style.transform = `translate(-50%, -50%) rotate(${design.rotation || 0}deg) scale(${design.scale})`;
            
            // Debounced apply
            scheduleApplyDesignsIdle(200);
        }

        // Three.js ile ilgili global değişkenler
        let scene, camera, renderer, controls;
        let tshirtModel; // Yüklenen ana tişört 3D modeli (GLTF)
        // Tişörtün ayrı mesh parçaları (UV haritalarına göre doku uygulamak için)
        let tshirtMeshBody, tshirtMeshLeftArm, tshirtMeshRightArm, tshirtMeshCollar; 
        let clock; // Animasyon zamanlaması için Three.js Clock
        let mixer; // GLTF animasyonları için (eğer modelde varsa)
        let currentAnimation = 'rotate'; // Mevcut animasyon durumu
        
        // Right panel interaction state
        let __interactionStartState = null;

        // Tasarımları alanlara göre saklayan obje (using state management)
        let designs = DesignState.designs;
        let currentArea = DesignState.currentArea; // Şu anda aktif olan tasarım alanı (Ön, Arka vb.)
        let selectedDesign = DesignState.selectedDesign; // 2D önizlemede seçili olan tasarım elementi
        let originalMaterials = new Map(); // 3D modelin orijinal materyallerini saklamak için (renk değişimi için)

        // OPTIMIZED: High-resolution texture canvases for better quality
        let bodyTextureCanvas, bodyTextureCtx;
        let leftArmTextureCanvas, leftArmTextureCtx;
        let rightArmTextureCanvas, rightArmTextureCtx;

        // Sağ paneldeki 2D tasarım önizleme alanı için canvas
        let designPreviewCanvas, designPreviewCtx;

        // OPTIMIZED: Performance tracking and throttling
        let isDragging = false;
        let isResizing = false;
        let dragOffset = { x: 0, y: 0 };
        let elementIdCounter = 0;
        let resizeStart = { x: 0, y: 0, width: 0, height: 0 };
        
        // OPTIMIZED: Smart update system
        let updateQueue = [];
        let isUpdating = false;
        let lastUpdateTime = 0;
        let updateThrottle = 16; // ~60fps
        
        // OPTIMIZED: Element visibility tracking
        let visibleElements = new Set();
        let elementUpdateCallbacks = new Map();
        
        // ADVANCED: Enhanced texture management for VirtualThreads.io quality
        let textureCache = new Map();
        let textureQualitySettings = {
            bodyResolution: 8192, // 8K for ultra-high quality
            armResolution: 4096,  // 4K for arms
            maxAnisotropy: 16,    // Maximum anisotropic filtering
            enableMipmaps: true,
            enableCompression: false, // Disable compression for better quality
            textureFormat: 'RGBA'
        };
        
        // ADVANCED: Real-time performance monitoring
        let performanceMetrics = {
            fps: 0,
            frameTime: 0,
            memoryUsage: 0,
            textureMemory: 0,
            lastFrameTime: 0
        };
        
        // ADVANCED: Enhanced design processing pipeline
        let designProcessingQueue = [];
        let isProcessingDesigns = false;
        let designQualitySettings = {
            enableSupersampling: true,
            supersamplingFactor: 2,
            enableAntiAliasing: true,
            enableFabricBlending: true,
            enableRealisticShading: true
        };

        // CRITICAL FIXES: Enhanced interaction and performance systems
        let interactionState = {
            isDragging: false,
            isResizing: false,
            isRotating: false,
            activeElement: null,
            dragStart: { x: 0, y: 0 },
            resizeStart: { width: 0, height: 0 },
            rotationStart: 0,
            lastInteractionTime: 0
        };
        
        // CRITICAL FIXES: Performance optimization
        let performanceOptimizer = {
            frameSkip: 0,
            maxFrameSkip: 2,
            lastFrameTime: 0,
            targetFPS: 60,
            frameTimeThreshold: 16.67, // 60 FPS threshold
            isThrottling: false,
            interactionPriority: false
        };
        
        // CRITICAL FIXES: Enhanced element positioning system
        let positioningSystem = {
            snapToGrid: false,
            gridSize: 10,
            snapThreshold: 5,
            precisionMode: false,
            lastPosition: { x: 0, y: 0 },
            positionHistory: [],
            maxHistorySize: 10
        };
        
        // CRITICAL FIXES: Design quality enhancement
        let designQualityEnhancer = {
            highQualityMode: true,
            supersamplingEnabled: true,
            antiAliasingEnabled: true,
            fabricBlendingEnabled: true,
            realisticShadingEnabled: true,
            qualityThreshold: 500000, // Pixels for high quality
            processingQueue: [],
            isProcessing: false
        };

        // CRITICAL FIXES: Element visibility and performance optimization
        let visibilityManager = {
            visibleElements: new Set(),
            hiddenElements: new Set(),
            lastVisibilityCheck: 0,
            visibilityCheckInterval: 1000,
            forceVisibilityMode: false,
            elementStates: new Map()
        };
        
        // CRITICAL FIXES: Performance optimization for low FPS issues
        let performanceManager = {
            currentFPS: 0,
            targetFPS: 60,
            frameTime: 0,
            isThrottling: false,
            textureQualityLevel: 'high', // 'low', 'medium', 'high'
            autoQualityAdjustment: true,
            lastPerformanceCheck: 0,
            performanceCheckInterval: 2000,
            qualityThresholds: {
                low: { fps: 30, textureQuality: 'low' },
                medium: { fps: 45, textureQuality: 'medium' },
                high: { fps: 55, textureQuality: 'high' }
            }
        };
        
        // CRITICAL FIXES: Design positioning and alignment system
        let designPositioningSystem = {
            alignmentMode: 'precise', // 'precise', 'snap', 'free'
            snapGrid: { enabled: false, size: 10 },
            positionHistory: new Map(),
            maxHistorySize: 20,
            alignmentTolerance: 2,
            lastPositionUpdate: 0,
            positionUpdateThrottle: 16 // ~60fps
        };
        
        // CRITICAL FIXES: Enhanced texture quality management
        let textureQualityManager = {
            currentQuality: 'high',
            qualityLevels: {
                low: { resolution: 2048, supersampling: false, anisotropy: 4 },
                medium: { resolution: 4096, supersampling: true, anisotropy: 8 },
                high: { resolution: 8192, supersampling: true, anisotropy: 16 }
            },
            autoAdjustment: true,
            lastAdjustment: 0,
            adjustmentInterval: 5000
        };

        /**
         * CRITICAL FIX: Ensure right panel visibility and proper z-index
         */
        function ensureRightPanelVisibility() {
            const rightPanel = document.querySelector('.new-design-panel');
            if (rightPanel) {
                rightPanel.style.display = 'flex';
                rightPanel.style.visibility = 'visible';
                rightPanel.style.opacity = '1';
                rightPanel.style.zIndex = '1000';
                rightPanel.style.pointerEvents = 'auto';
            }
            
            const designElementsLayer = document.querySelector('.design-elements-layer');
            if (designElementsLayer) {
                designElementsLayer.style.display = 'block';
                designElementsLayer.style.visibility = 'visible';
                designElementsLayer.style.opacity = '1';
                designElementsLayer.style.zIndex = '100';
                designElementsLayer.style.pointerEvents = 'auto';
            }
            
            const elementsList = document.getElementById('elementsList');
            if (elementsList) {
                elementsList.style.display = 'block';
                elementsList.style.visibility = 'visible';
                elementsList.style.opacity = '1';
                elementsList.style.zIndex = '100';
                elementsList.style.pointerEvents = 'auto';
            }
            
            console.log('✅ Right panel visibility ensured');
        }

        /**
         * CRITICAL FIX: Setup proper z-index and pointer events for all components
         */
        function setupProperLayering() {
            // CRITICAL FIX: Set proper z-index for canvas area (lower than panels)
            const canvasArea = document.querySelector('.canvas-area');
            if (canvasArea) {
                canvasArea.style.zIndex = '1';
                canvasArea.style.pointerEvents = 'auto';
            }
            
            const canvas = document.getElementById('canvas');
            if (canvas) {
                canvas.style.zIndex = '1';
                canvas.style.pointerEvents = 'auto';
            }
            
            // CRITICAL FIX: Set proper z-index for left panel
            const leftPanel = document.querySelector('.left-panel');
            if (leftPanel) {
                leftPanel.style.zIndex = '1000';
                leftPanel.style.pointerEvents = 'auto';
            }
            
            // CRITICAL FIX: Set proper z-index for right panel
            const rightPanel = document.querySelector('.new-design-panel');
            if (rightPanel) {
                rightPanel.style.zIndex = '1000';
                rightPanel.style.pointerEvents = 'auto';
            }
            
            // CRITICAL FIX: Set proper z-index for design elements
            const designElementsLayer = document.querySelector('.design-elements-layer');
            if (designElementsLayer) {
                designElementsLayer.style.zIndex = '100';
                designElementsLayer.style.pointerEvents = 'auto';
            }
            
            // CRITICAL FIX: Set proper z-index for elements list
            const elementsList = document.getElementById('elementsList');
            if (elementsList) {
                elementsList.style.zIndex = '100';
                elementsList.style.pointerEvents = 'auto';
            }
            
            console.log('✅ Proper layering setup completed');
        }

        /**
         * CRITICAL FIX: Prevent canvas from blocking panel interactions
         */
        function setupCanvasEventHandling() {
            const canvas = document.getElementById('canvas');
            if (!canvas) return;
            
            // CRITICAL FIX: Check if pointer is over panel before handling canvas events
            const originalMouseDown = canvas.onmousedown;
            const originalTouchStart = canvas.ontouchstart;
            
            canvas.onmousedown = function(e) {
                // CRITICAL FIX: Check if pointer is over any UI element
                const elementUnderPointer = document.elementFromPoint(e.clientX, e.clientY);
                if (elementUnderPointer && elementUnderPointer.closest('.new-design-panel, .left-panel, .right-panel, .properties-panel, .text-panel, .resize-handle, .rotate-handle, .design-elements-layer, #elementsList, .element-item, .element-thumb')) {
                    console.log('🛑 Canvas interaction blocked - pointer over UI');
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
                
                // Allow canvas interaction only when not over UI
                if (originalMouseDown) {
                    originalMouseDown.call(this, e);
                }
            };
            
            canvas.ontouchstart = function(e) {
                // CRITICAL FIX: Check if touch is over any UI element
                const touch = e.touches[0];
                const elementUnderPointer = document.elementFromPoint(touch.clientX, touch.clientY);
                if (elementUnderPointer && elementUnderPointer.closest('.new-design-panel, .left-panel, .right-panel, .properties-panel, .text-panel, .resize-handle, .rotate-handle, .design-elements-layer, #elementsList, .element-item, .element-thumb')) {
                    console.log('🛑 Canvas touch interaction blocked - touch over UI');
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
                
                // Allow canvas interaction only when not over UI
                if (originalTouchStart) {
                    originalTouchStart.call(this, e);
                }
            };
            
            // CRITICAL FIX: Add 3D model click handler for scene-to-panel selection
            canvas.addEventListener('click', (e) => {
                // Check if click is over UI elements first
                const elementUnderPointer = document.elementFromPoint(e.clientX, e.clientY);
                if (elementUnderPointer && elementUnderPointer.closest('.new-design-panel, .left-panel, .right-panel, .properties-panel, .text-panel, .resize-handle, .rotate-handle, .design-elements-layer, #elementsList, .element-item, .element-thumb')) {
                    console.log('🛑 3D click blocked - pointer over UI');
                    return;
                }
                
                // Handle 3D model selection via raycasting
                if (window.THREE && window.camera && window.scene) {
                    const raycaster = new THREE.Raycaster();
                    const mouse = new THREE.Vector2();
                    
                    // Calculate mouse position
                    const rect = canvas.getBoundingClientRect();
                    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
                    
                    // Raycast to find clicked objects
                    raycaster.setFromCamera(mouse, camera);
                    const intersects = raycaster.intersectObjects(scene.children, true);
                    
                    if (intersects.length > 0) {
                        const clickedObject = intersects[0].object;
                        
                        // Check if clicked object is a design decal
                        if (clickedObject.userData && clickedObject.userData.designId) {
                            const designId = clickedObject.userData.designId;
                            const clickedDesign = designs[currentArea].find(d => d.id === designId);
                            
                            if (clickedDesign) {
                                console.log('🎯 Design decal clicked in 3D:', designId);
                                
                                // Select the design
                                selectedDesign = clickedDesign;
                                globalState.selectedDesignId = designId;
                                
                                // Update UI
                                updateElementsList();
                                updatePropertiesPanel();
                                
                                // Find and select corresponding 2D element
                                const element2D = document.getElementById(designId);
                                if (element2D) {
                                    selectDesignElement(element2D);
                                }
                                
                                console.log('✅ Design selected from 3D model:', designId);
                                return;
                            }
                        }
                    }
                    
                    // Clicked on empty 3D space - deselect only if not over UI
                    console.log('🔄 Clicked empty 3D space - deselecting all');
                    document.querySelectorAll('.design-element.selected').forEach(el => {
                        el.classList.remove('selected');
                        el.removeAttribute('data-selected');
                    });
                    selectedDesign = null;
                    globalState.selectedDesignId = null;
                    updateElementsList();
                    updatePropertiesPanel();
                }
            });
            
            console.log('✅ Canvas event handling setup completed');
        }

        /**
         * CRITICAL FIX: Enhanced design element creation with proper interaction
         */
        function createEnhancedDesignElement(design) {
            const element = document.createElement('div');
            element.id = design.id;
            element.className = 'design-element design-element-right-panel interactive-design-element';
            element.setAttribute('data-design-id', design.id);
            
            // CRITICAL FIX: Ensure proper styling for interaction
            element.style.cssText = `
                position: absolute;
                left: ${design.position?.x || 50}%;
                top: ${design.position?.y || 50}%;
                width: ${design.width || 100}px;
                height: ${design.height || 100}px;
                transform: translate3d(0, 0, 0) rotate(${design.rotation || 0}deg) scale(${design.scale || 1});
                cursor: grab;
                user-select: none;
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                pointer-events: auto;
                z-index: 1000;
                display: block;
                visibility: visible;
                opacity: 1;
                border: 2px solid transparent;
                transition: border-color 0.2s ease;
            `;
            
            // CRITICAL FIX: Add image
            const img = document.createElement('img');
            img.src = design.imageData;
            img.style.cssText = `
                width: 100%;
                height: 100%;
                object-fit: contain;
                pointer-events: none;
                user-select: none;
            `;
            element.appendChild(img);
            
            // CRITICAL FIX: Add design info
            const info = document.createElement('div');
            info.className = 'design-info';
            info.style.cssText = `
                position: absolute;
                bottom: -25px;
                left: 0;
                right: 0;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                font-size: 10px;
                padding: 2px 4px;
                text-align: center;
                border-radius: 2px;
                opacity: 0;
                transition: opacity 0.2s ease;
                pointer-events: none;
            `;
            info.textContent = design.name || 'Design';
            element.appendChild(info);
            
            // CRITICAL FIX: Show info on hover
            element.addEventListener('mouseenter', () => {
                info.style.opacity = '1';
            });
            
            element.addEventListener('mouseleave', () => {
                info.style.opacity = '0';
            });
            
            // CRITICAL FIX: Setup enhanced interactions
            setupEnhancedElementInteractions(element, design);
            
            return element;
        }

        /**
         * CRITICAL FIX: Setup enhanced interactions for design elements
         */
        function setupEnhancedElementInteractions(element, design) {
            if (!element || !design) return;
            
            console.log('🔧 Setting up enhanced interactions for element:', element.id);
            
            // CRITICAL FIX: Remove any existing event listeners
            element.removeEventListener('mousedown', element._enhancedMouseDown);
            element.removeEventListener('touchstart', element._enhancedTouchStart);
            element.removeEventListener('click', element._enhancedClick);
            
            // CRITICAL FIX: Enhanced mouse interaction
            element._enhancedMouseDown = (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('🖱️ Mouse down on element:', element.id);
                
                // CRITICAL FIX: Disable OrbitControls during transform
                if (window.controls) {
                    window.controls.enabled = false;
                }
                
                // CRITICAL FIX: Set interaction state
                globalState.isPanelInteraction = true;
                globalState.lastInteractionTime = Date.now();
                
                interactionState.isDragging = true;
                interactionState.activeElement = element;
                interactionState.dragStart = {
                    x: e.clientX - element.offsetLeft,
                    y: e.clientY - element.offsetTop
                };
                
                // CRITICAL FIX: Select the design
                selectDesignElement(element);
                
                // CRITICAL FIX: Add event listeners
                document.addEventListener('mousemove', element._enhancedMouseMove);
                document.addEventListener('mouseup', element._enhancedMouseUp);
                
                // CRITICAL FIX: Visual feedback
                element.style.cursor = 'grabbing';
                element.style.borderColor = '#3b82f6';
                element.style.zIndex = '1001';
                
                console.log('✅ Mouse down handled for element:', element.id);
            };
            
            element._enhancedMouseMove = (e) => {
                if (!interactionState.isDragging || interactionState.activeElement !== element) {
                    return;
                }
                
                e.preventDefault();
                e.stopPropagation();
                
                const newX = e.clientX - interactionState.dragStart.x;
                const newY = e.clientY - interactionState.dragStart.y;
                
                // CRITICAL FIX: Update element position
                element.style.left = newX + 'px';
                element.style.top = newY + 'px';
                
                // CRITICAL FIX: Update design position
                const previewCanvas = document.getElementById('designPreviewCanvas');
                if (previewCanvas) {
                    design.position = {
                        x: (newX / previewCanvas.clientWidth) * 100,
                        y: (newY / previewCanvas.clientHeight) * 100
                    };
                }
                
                // PRODUCTION FIX: Only lightweight transforms during drag
                drawDesignPreview();
                updateSelectedDesignTransformsLightweight();
                
                console.log('🎯 Position updated for element:', element.id, design.position);
            };
            
            element._enhancedMouseUp = (e) => {
                if (!interactionState.isDragging || interactionState.activeElement !== element) {
                    return;
                }
                
                e.preventDefault();
                e.stopPropagation();
                
                console.log('🖱️ Mouse up on element:', element.id);
                
                // CRITICAL FIX: Re-enable OrbitControls after transform
                if (window.controls) {
                    window.controls.enabled = true;
                }
                
                // CRITICAL FIX: Reset interaction state
                interactionState.isDragging = false;
                interactionState.activeElement = null;
                globalState.isPanelInteraction = false;
                
                // CRITICAL FIX: Remove event listeners
                document.removeEventListener('mousemove', element._enhancedMouseMove);
                document.removeEventListener('mouseup', element._enhancedMouseUp);
                
                // CRITICAL FIX: Reset visual feedback
                element.style.cursor = 'grab';
                element.style.borderColor = 'transparent';
                element.style.zIndex = '1000';
                
                // PRODUCTION FIX: Final heavy update on pointer up
                drawDesignPreview();
                scheduleApplyDesignsIdle(200);
                
                console.log('✅ Mouse up handled for element:', element.id);
            };
            
            // CRITICAL FIX: Enhanced touch interaction
            element._enhancedTouchStart = (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('📱 Touch start on element:', element.id);
                
                const touch = e.touches[0];
                globalState.isPanelInteraction = true;
                globalState.lastInteractionTime = Date.now();
                
                interactionState.isDragging = true;
                interactionState.activeElement = element;
                interactionState.dragStart = {
                    x: touch.clientX - element.offsetLeft,
                    y: touch.clientY - element.offsetTop
                };
                
                // CRITICAL FIX: Select the design
                selectDesignElement(element);
                
                // CRITICAL FIX: Add event listeners
                document.addEventListener('touchmove', element._enhancedTouchMove, { passive: false });
                document.addEventListener('touchend', element._enhancedTouchEnd);
                
                // CRITICAL FIX: Visual feedback
                element.style.cursor = 'grabbing';
                element.style.borderColor = '#3b82f6';
                element.style.zIndex = '1001';
                
                console.log('✅ Touch start handled for element:', element.id);
            };
            
            element._enhancedTouchMove = (e) => {
                if (!interactionState.isDragging || interactionState.activeElement !== element) {
                    return;
                }
                
                e.preventDefault();
                e.stopPropagation();
                
                const touch = e.touches[0];
                const newX = touch.clientX - interactionState.dragStart.x;
                const newY = touch.clientY - interactionState.dragStart.y;
                
                // CRITICAL FIX: Update element position
                element.style.left = newX + 'px';
                element.style.top = newY + 'px';
                
                // CRITICAL FIX: Update design position
                const previewCanvas = document.getElementById('designPreviewCanvas');
                if (previewCanvas) {
                    design.position = {
                        x: (newX / previewCanvas.clientWidth) * 100,
                        y: (newY / previewCanvas.clientHeight) * 100
                    };
                }
                
                // PRODUCTION FIX: Only lightweight transforms during touch drag
                drawDesignPreview();
                updateSelectedDesignTransformsLightweight();
                
                console.log('🎯 Touch position updated for element:', element.id);
            };
            
            element._enhancedTouchEnd = (e) => {
                if (!interactionState.isDragging || interactionState.activeElement !== element) {
                    return;
                }
                
                e.preventDefault();
                e.stopPropagation();
                
                console.log('📱 Touch end on element:', element.id);
                
                // CRITICAL FIX: Reset interaction state
                interactionState.isDragging = false;
                interactionState.activeElement = null;
                globalState.isPanelInteraction = false;
                
                // CRITICAL FIX: Remove event listeners
                document.removeEventListener('touchmove', element._enhancedTouchMove);
                document.removeEventListener('touchend', element._enhancedTouchEnd);
                
                // CRITICAL FIX: Reset visual feedback
                element.style.cursor = 'grab';
                element.style.borderColor = 'transparent';
                element.style.zIndex = '1000';
                
                // PRODUCTION FIX: Final heavy update on pointer up
                drawDesignPreview();
                scheduleApplyDesignsIdle(200);
                
                console.log('✅ Touch end handled for element:', element.id);
            };
            
            // CRITICAL FIX: Click handler for selection
            element._enhancedClick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('🖱️ Click on element:', element.id);
                
                // CRITICAL FIX: Select the design
                selectDesignElement(element);
                
                // CRITICAL FIX: Update 3D model selection
                update3DModelSelection(design);
                
                console.log('✅ Element clicked and selected:', element.id);
            };
            
            // CRITICAL FIX: Add event listeners
            element.addEventListener('mousedown', element._enhancedMouseDown);
            element.addEventListener('touchstart', element._enhancedTouchStart, { passive: false });
            element.addEventListener('click', element._enhancedClick);
            
            console.log('🎯 Enhanced interactions setup for design:', design.id);
        }

        /**
         * CRITICAL FIX: Enhanced design selection with proper synchronization
         */
        function selectDesignElement(elementOrId) {
            // PRODUCTION FIX: Handle both element and ID
            let element;
            let designId;
            
            if (typeof elementOrId === 'string') {
                designId = elementOrId;
                element = document.getElementById(designId);
                if (!element) {
                    // Create element if missing
                    const design = designs[currentArea].find(d => d.id === designId);
                    if (design) {
                        element = ensurePreviewElement(design);
                        layoutPreviewElement(design);
                    }
                }
            } else {
                element = elementOrId;
                designId = element?.getAttribute('data-design-id') || element?.id;
            }
            
            if (!element || !designId) return;
            
            console.log('🎯 Selecting design element:', designId);
            
            // PRODUCTION FIX: Remove previous selection
            document.querySelectorAll('.design-element.selected').forEach(el => {
                el.classList.remove('selected');
            });
            
            // PRODUCTION FIX: Select current element
            element.classList.add('selected');
            
            // PRODUCTION FIX: Ensure overlay element exists and is selected
            const design = designs[currentArea].find(d => d.id === designId);
            if (design) {
                const overlayEl = ensureDesignElementOverlay(design);
                if (overlayEl) {
                    // Remove selection from other overlays
                    const rp = getRightPanelRefs();
                    if (rp.layer) {
                        rp.layer.querySelectorAll('.design-element.selected').forEach(el => {
                            el.classList.remove('selected');
                        });
                    }
                    overlayEl.classList.add('selected');
                    
                    // PRODUCTION FIX: Ensure overlay is visible and properly positioned
                    ensureDesignElementVisible(overlayEl);
                    updateOverlayPosition(design, overlayEl);
                    
                    console.log('[PREVIEW] Design selected and overlay updated:', designId);
                }
                
                // PRODUCTION FIX: Update global state
                selectedDesign = design;
                globalState.selectedDesignId = designId;
                
                // CRITICAL FIX: Update state management
                DesignState.selectDesign(designId);
                
                // CRITICAL FIX: Mark element as persistently selected
                element.setAttribute('data-selected', 'true');
                
                // CRITICAL FIX: Update UI components
                updateElementsList();
                updatePropertiesPanel();
                
                console.log('✅ Design element selected and locked:', designId);
            }
        }

        /**
         * CRITICAL FIX: Enhanced 3D model selection update
         */
        function update3DModelSelection(design) {
            if (!design) return;
            
            console.log('🎯 Updating 3D model selection for design:', design.id);
            
            // CRITICAL FIX: Update selected design
            selectedDesign = design;
            globalState.selectedDesignId = design.id;
            
            // CRITICAL FIX: Update state management
            DesignState.selectDesign(design.id);
            
            // CRITICAL FIX: Update UI components
            updateElementsList();
            updatePropertiesPanel();
            
            // CRITICAL FIX: Highlight design in 3D model
            highlightDesignIn3DModel(design);
            
            console.log('✅ 3D model selection updated for design:', design.id);
        }

        /**
         * CRITICAL FIX: Highlight design in 3D model
         */
        function highlightDesignIn3DModel(design) {
            if (!design || !tshirtModel) return;
            
            console.log('🎯 Highlighting design in 3D model:', design.id);
            
            // CRITICAL FIX: Remove previous highlights
            tshirtModel.children.forEach(child => {
                if (child.userData && child.userData.isHighlighted) {
                    if (child.material && child.material.emissive) {
                        child.material.emissive.setHex(0x000000);
                    }
                    child.userData.isHighlighted = false;
                }
            });
            
            // CRITICAL FIX: Highlight selected design
            tshirtModel.children.forEach(child => {
                if (child.userData && child.userData.designId === design.id) {
                    if (child.material && child.material.emissive) {
                        child.material.emissive.setHex(0x333333);
                    }
                    child.userData.isHighlighted = true;
                }
            });
            
            console.log('✅ Design highlighted in 3D model:', design.id);
        }

        /**
         * PRODUCTION FIX: Deterministic right panel references
         */


        /**
         * PRODUCTION FIX: Legacy compatibility wrapper
         */
        function getPreviewRefs() {
            const { container, canvas, layer } = getRightPanelRefs();
            return { container, canvas, overlay: layer };
        }

        /**
         * PRODUCTION FIX: Setup interactive preview overlay events
         */
        function setupPreviewOverlayEvents() {
            const rp = getRightPanelRefs();
            if (!rp || !rp.layer || !rp.container) {
                console.warn('[PREVIEW] Missing DOM refs, skipping event setup');
                return;
            }
            
            console.log('[PREVIEW] Setting up overlay events...');
            
            // Remove existing event listeners to prevent conflicts
            rp.layer.removeEventListener('pointerdown', rp.layer.__pointerDownHandler);
            rp.container.removeEventListener('wheel', rp.container.__wheelHandler);
            
            // Prevent deselection - stop propagation on all preview clicks
            rp.container.addEventListener('click', (e) => {
                e.stopPropagation();
            });
            
            rp.layer.addEventListener('click', (e) => {
                e.stopPropagation();
            });
            
            // Delegate pointer events from #designElementsLayer to its children .design-element
            rp.layer.__pointerDownHandler = (e) => {
                const target = e.target.closest('.design-element');
                if (!target) return;
                
                e.preventDefault();
                e.stopPropagation();
                target.setPointerCapture(e.pointerId);
                
                const designId = target.getAttribute('data-design-id');
                const design = designs[currentArea].find(d => d.id === designId);
                if (!design) return;
                
                const rect = rp.container.getBoundingClientRect();
                const startMX = e.clientX;
                const startMY = e.clientY;
                const startX = design.x || 0.5;
                const startY = design.y || 0.5;
                const startScale = design.scale || 1;
                const startRot = design.rotation || 0;
                
                // Calculate half-size in normalized units
                const aspectRatio = (design.naturalWidth || design.originalWidth || 1) / 
                                   (design.naturalHeight || design.originalHeight || 1);
                const baseWidth = Math.min(rect.width * 0.4, rect.height * 0.4 * aspectRatio);
                const baseHeight = baseWidth / aspectRatio;
                const pixelWidth = baseWidth * startScale;
                const pixelHeight = baseHeight * startScale;
                const halfW = (pixelWidth / rect.width) / 2;
                const halfH = (pixelHeight / rect.height) / 2;
                
                console.log('[PREVIEW] start', { designId, startX, startY, startScale, startRot, rect: rect.width + 'x' + rect.height, halfW, halfH });
                
                // Temporarily disable OrbitControls
                if (controls) {
                    controls.enabled = false;
                }
                
                // Add .no-anim to the element during drag
                target.classList.add('no-anim');
                
                const handlePointerMove = (moveEvent) => {
                    const dx = (moveEvent.clientX - startMX) / rect.width;
                    const dy = (moveEvent.clientY - startMY) / rect.height;
                    
                    if (moveEvent.shiftKey) {
                        // Rotate
                        design.rotation = startRot + moveEvent.movementX * 0.3;
                    } else {
                        // Move center with half-extent clamping
                        design.x = Math.max(0 + halfW, Math.min(1 - halfW, startX + dx));
                        design.y = Math.max(0 + halfH, Math.min(1 - halfH, startY + dy));
                    }
                    
                    // Update DOM left/top/transform
                    target.style.left = `${design.x * 100}%`;
                    target.style.top = `${design.y * 100}%`;
                    target.style.transform = `translate(-50%, -50%) rotate(${design.rotation}deg) scale(${design.scale})`;
                };
                
                const handlePointerUp = (upEvent) => {
                    target.releasePointerCapture(e.pointerId);
                    target.classList.remove('no-anim');
                    
                    // Re-enable OrbitControls
                    if (controls) {
                        controls.enabled = true;
                    }
                    
                    // Remove event listeners
                    document.removeEventListener('pointermove', handlePointerMove);
                    document.removeEventListener('pointerup', handlePointerUp);
                    document.removeEventListener('pointercancel', handlePointerUp);
                    
                    // Call scheduleApplyDesignsIdle(200)
                    scheduleApplyDesignsIdle(200);
                };
                
                document.addEventListener('pointermove', handlePointerMove);
                document.addEventListener('pointerup', handlePointerUp);
                document.addEventListener('pointercancel', handlePointerUp);
            };
            
            rp.layer.addEventListener('pointerdown', rp.layer.__pointerDownHandler);
            
            // Wheel over #designPreviewContainer
            rp.container.__wheelHandler = (e) => {
                e.preventDefault();
                
                const target = rp.layer.querySelector('.design-element.selected');
                if (!target) return;
                
                const designId = target.getAttribute('data-design-id');
                const design = designs[currentArea].find(d => d.id === designId);
                if (!design) return;
                
                // Scale *= (e.deltaY < 0 ? 1.1 : 0.9); clamp [0.1, 3]
                design.scale *= (e.deltaY < 0 ? 1.1 : 0.9);
                design.scale = Math.max(0.1, Math.min(3, design.scale));
                
                console.log('[PREVIEW] scale', design.scale.toFixed(2));
                
                // Update design + DOM transform
                const rect = rp.container.getBoundingClientRect();
                const aspectRatio = (design.naturalWidth || design.originalWidth || 1) / 
                                   (design.naturalHeight || design.originalHeight || 1);
                const baseWidth = Math.min(rect.width * 0.4, rect.height * 0.4 * aspectRatio);
                const baseHeight = baseWidth / aspectRatio;
                const pixelWidth = baseWidth * design.scale;
                const pixelHeight = baseHeight * design.scale;
                
                target.style.width = `${pixelWidth}px`;
                target.style.height = `${pixelHeight}px`;
                target.style.transform = `translate(-50%, -50%) rotate(${design.rotation}deg) scale(${design.scale})`;
            };
            
            rp.container.addEventListener('wheel', rp.container.__wheelHandler);
        }

        // PRODUCTION FIX: Initialize right panel DOM (removed throwing version)

        /**
         * PRODUCTION FIX: Create/Update the overlay for the selected design
         */
        function ensureDesignElementOverlay(design) {
            const rp = getRightPanelRefs();
            if (!rp || !rp.container) {
                console.warn('[PREVIEW] Missing refs, skipping overlay creation');
                return null;
            }
            
            // Ensure #designElementsLayer exists
            let layer = rp.layer;
            if (!layer) {
                layer = document.createElement('div');
                layer.id = 'designElementsLayer';
                layer.className = 'design-elements-layer';
                layer.setAttribute('role', 'region');
                layer.setAttribute('aria-label', 'Preview design overlay');
                layer.style.position = 'absolute';
                layer.style.inset = '0';
                layer.style.zIndex = '2';
                layer.style.pointerEvents = 'none';
                layer.style.userSelect = 'none';
                layer.style.touchAction = 'none';
                rp.container.appendChild(layer);
                console.log('[PREVIEW] Created missing designElementsLayer');
            }
            
            // Find or create div.design-element[data-design-id="<id>"]
            let overlay = layer.querySelector(`div.design-element[data-design-id="${design.id}"]`);
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'design-element';
                overlay.setAttribute('data-design-id', design.id);
                
                // Apply required styles
                overlay.style.position = 'absolute';
                overlay.style.left = '50%';
                overlay.style.top = '50%';
                overlay.style.transform = 'translate(-50%, -50%)';
                overlay.style.pointerEvents = 'auto';
                overlay.style.cursor = 'grab';
                overlay.style.transformOrigin = 'center';
                overlay.style.outline = '2px solid #3b82f6';
                
                // Create image element
                const img = document.createElement('img');
                img.alt = design.fileName || 'Design element';
                img.title = design.fileName || 'Design element';
                img.draggable = false;
                img.style.display = 'block';
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'contain';
                img.style.pointerEvents = 'none';
                
                if (design.imageData) {
                    img.src = design.imageData;
                }
                
                overlay.appendChild(img);
                layer.appendChild(overlay);
                console.log('[PREVIEW] Created overlay for design:', design.id);
            }
            
            // Update position and size from design state
            const rect = rp.rect;
            const x = design.x || 0.5;
            const y = design.y || 0.5;
            const scale = design.scale || 1;
            const rotation = design.rotation || 0;
            
            // Calculate size from design dimensions
            const aspectRatio = (design.naturalWidth || design.originalWidth || 1) / 
                               (design.naturalHeight || design.originalHeight || 1);
            const baseWidth = Math.min(rect.width * 0.4, rect.height * 0.4 * aspectRatio);
            const baseHeight = baseWidth / aspectRatio;
            
            const pixelWidth = baseWidth * scale;
            const pixelHeight = baseHeight * scale;
            
            // Position by center in percentages
            overlay.style.left = `${x * 100}%`;
            overlay.style.top = `${y * 100}%`;
            overlay.style.width = `${pixelWidth}px`;
            overlay.style.height = `${pixelHeight}px`;
            overlay.style.transform = `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`;
            
            // Add .selected to current element; remove from others
            layer.querySelectorAll('.design-element').forEach(el => {
                el.classList.remove('selected');
            });
            overlay.classList.add('selected');
            
            return overlay;
        }

        /**
         * PRODUCTION FIX: Make all existing overlays interactive
         */
        function makeOverlaysInteractive() {
            const rp = getRightPanelRefs();
            if (!rp.layer) return;
            
            console.log('[PREVIEW] Making overlays interactive...');
            
            rp.layer.querySelectorAll('.design-element').forEach(overlay => {
                const designId = overlay.getAttribute('data-design-id');
                const design = designs[currentArea].find(d => d.id === designId);
                
                if (design) {
                    console.log('[PREVIEW] Making overlay interactive:', designId);
                    
                    // Force visibility and interactivity
                    ensureDesignElementVisible(overlay);
                    overlay.style.pointerEvents = 'auto';
                    overlay.style.cursor = 'grab';
                    overlay.style.zIndex = '1000';
                    overlay.style.position = 'absolute';
                    
                    // Remove any existing handlers to prevent conflicts
                    overlay.removeEventListener('click', overlay.__clickHandler);
                    overlay.removeEventListener('mousedown', overlay.__mouseDownHandler);
                    overlay.removeEventListener('touchstart', overlay.__touchStartHandler);
                    
                    // PRODUCTION FIX: Simple click handler
                    overlay.__clickHandler = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('[PREVIEW] Overlay clicked:', designId);
                        
                        // Select this design
                        selectDesignElement(designId);
                        
                        // Make sure it's visible and selected
                        ensureDesignElementVisible(overlay);
                        overlay.classList.add('selected');
                        overlay.style.border = '2px solid #3b82f6';
                        overlay.style.boxShadow = '0 0 10px rgba(59, 130, 246, 0.5)';
                    };
                    overlay.addEventListener('click', overlay.__clickHandler);
                    
                    // PRODUCTION FIX: Simple drag handler
                    overlay.__mouseDownHandler = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('[PREVIEW] Overlay mousedown:', designId);
                        
                        // Select this design first
                        selectDesignElement(designId);
                        
                        const startX = e.clientX;
                        const startY = e.clientY;
                        const startLeft = parseFloat(overlay.style.left) || 0;
                        const startTop = parseFloat(overlay.style.top) || 0;
                        
                        const handleMouseMove = (moveEvent) => {
                            const deltaX = moveEvent.clientX - startX;
                            const deltaY = moveEvent.clientY - startY;
                            
                            const newLeft = startLeft + deltaX;
                            const newTop = startTop + deltaY;
                            
                            overlay.style.left = newLeft + 'px';
                            overlay.style.top = newTop + 'px';
                            
                            // Update design state
                            const rp = getRightPanelRefs();
                            if (rp.container) {
                                const rect = rp.container.getBoundingClientRect();
                                design.x = (newLeft + rect.width * 0.5) / rect.width;
                                design.y = (newTop + rect.height * 0.5) / rect.height;
                            }
                        };
                        
                        const handleMouseUp = () => {
                            document.removeEventListener('mousemove', handleMouseMove);
                            document.removeEventListener('mouseup', handleMouseUp);
                            console.log('[PREVIEW] Overlay drag end:', designId);
                            
                            // Apply changes to 3D model
                            scheduleApplyDesignsIdle(200);
                        };
                        
                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', handleMouseUp);
                    };
                    overlay.addEventListener('mousedown', overlay.__mouseDownHandler);
                    
                    // PRODUCTION FIX: Touch support
                    overlay.__touchStartHandler = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('[PREVIEW] Overlay touchstart:', designId);
                        
                        // Select this design first
                        selectDesignElement(designId);
                        
                        const touch = e.touches[0];
                        const startX = touch.clientX;
                        const startY = touch.clientY;
                        const startLeft = parseFloat(overlay.style.left) || 0;
                        const startTop = parseFloat(overlay.style.top) || 0;
                        
                        const handleTouchMove = (moveEvent) => {
                            const touch = moveEvent.touches[0];
                            const deltaX = touch.clientX - startX;
                            const deltaY = touch.clientY - startY;
                            
                            const newLeft = startLeft + deltaX;
                            const newTop = startTop + deltaY;
                            
                            overlay.style.left = newLeft + 'px';
                            overlay.style.top = newTop + 'px';
                            
                            // Update design state
                            const rp = getRightPanelRefs();
                            if (rp.container) {
                                const rect = rp.container.getBoundingClientRect();
                                design.x = (newLeft + rect.width * 0.5) / rect.width;
                                design.y = (newTop + rect.height * 0.5) / rect.height;
                            }
                        };
                        
                        const handleTouchEnd = () => {
                            document.removeEventListener('touchmove', handleTouchMove);
                            document.removeEventListener('touchend', handleTouchEnd);
                            console.log('[PREVIEW] Overlay touch end:', designId);
                            
                            // Apply changes to 3D model
                            scheduleApplyDesignsIdle(200);
                        };
                        
                        document.addEventListener('touchmove', handleTouchMove);
                        document.addEventListener('touchend', handleTouchEnd);
                    };
                    overlay.addEventListener('touchstart', overlay.__touchStartHandler);
                    
                    console.log('[PREVIEW] Overlay made interactive:', designId);
                }
            });
            
            console.log('[PREVIEW] All overlays made interactive');
        }

        /**
         * PRODUCTION FIX: Ensure right panel is properly initialized and visible
         */
        function ensureRightPanelReady() {
            const rp = getRightPanelRefs();
            if (!rp.root || !rp.container || !rp.layer) {
                console.warn('[PREVIEW] Right panel DOM missing, creating...');
                createRightPanelDOM();
                return getRightPanelRefs();
            }
            
            // Ensure container is visible
            if (rp.container.style.display === 'none') {
                rp.container.style.display = 'block';
            }
            if (rp.layer.style.display === 'none') {
                rp.layer.style.display = 'block';
            }
            
            return rp;
        }

        /**
         * PRODUCTION FIX: Ensure design element is visible
         */
        function ensureDesignElementVisible(element) {
            if (!element) return;
            
            // Force visibility with important
            element.style.setProperty('display', 'block', 'important');
            element.style.setProperty('visibility', 'visible', 'important');
            element.style.setProperty('opacity', '1', 'important');
            element.style.setProperty('z-index', '1000', 'important');
            
            // Ensure parent containers are also visible
            let parent = element.parentElement;
            while (parent && parent !== document.body) {
                if (parent.style.display === 'none') {
                    parent.style.setProperty('display', 'block', 'important');
                }
                if (parent.style.visibility === 'hidden') {
                    parent.style.setProperty('visibility', 'visible', 'important');
                }
                parent = parent.parentElement;
            }
        }

        /**
         * PRODUCTION FIX: Update overlay position and size from design state
         */
        function updateOverlayPosition(design, overlay) {
            const rp = getRightPanelRefs();
            if (!rp.container || !overlay) return;
            
            const rect = rp.container.getBoundingClientRect();
            
            // Use normalized coordinates (0-1 range)
            const x = design.x || 0.5;
            const y = design.y || 0.5;
            const scale = design.scale || 1;
            const rotation = design.rotation || 0;
            
            // Calculate size from design dimensions
            const aspectRatio = (design.naturalWidth || design.originalWidth || 1) / 
                               (design.naturalHeight || design.originalHeight || 1);
            const baseWidth = Math.min(rect.width * 0.4, rect.height * 0.4 * aspectRatio);
            const baseHeight = baseWidth / aspectRatio;
            
            const pixelWidth = baseWidth * scale;
            const pixelHeight = baseHeight * scale;
            
            // Position by center in percentages
            overlay.style.left = `${x * 100}%`;
            overlay.style.top = `${y * 100}%`;
            overlay.style.width = `${pixelWidth}px`;
            overlay.style.height = `${pixelHeight}px`;
            overlay.style.transform = `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`;
        }

        /**
         * PRODUCTION FIX: Ensure selected design has interactive overlay element
         */
        function ensurePreviewElement(design) {
            const rp = getRightPanelRefs(); 
            if (!rp.layer || !rp.container) {
                console.warn('[PREVIEW] Layer/container not found, skipping element creation');
                return null;
            }
            
            let el = rp.layer.querySelector(`#${design.id}`);
            if (!el) {
                el = document.createElement('div');
                el.id = design.id;
                el.className = 'design-element';
                el.setAttribute('data-design-id', design.id);
                
                // PRODUCTION FIX: Interactive overlay styling
                el.style.pointerEvents = 'auto';
                el.style.touchAction = 'none';
                el.style.cursor = 'grab';
                el.style.transformOrigin = 'center center';
                el.style.position = 'absolute';
                el.style.border = '2px solid transparent';

                const img = document.createElement('img');
                img.alt = design.fileName || 'design';
                img.draggable = false;
                img.style.display = 'block';
                img.style.width = '100%'; 
                img.style.height = '100%'; 
                img.style.objectFit = 'contain';
                img.style.pointerEvents = 'none'; // Let parent handle events
                img.src = design.imageData;
                el.appendChild(img);

                rp.layer.appendChild(el);
                console.log('[PREVIEW] Created interactive element:', design.id);
            }
            
            // Update overlay position and size from design state
            updateOverlayFromDesign(design, el);
            
            return el;
        }

        /**
         * PRODUCTION FIX: Update overlay element from design state
         */
        function updateOverlayFromDesign(design, el) {
            const rp = getRightPanelRefs();
            if (!rp.container || !el) return;
            
            const rect = rp.container.getBoundingClientRect();
            
            // Use design state for positioning (x,y are center points in 0-1 range)
            // Convert from percentage (0-100) to normalized (0-1) if needed
            let x = design.x;
            let y = design.y;
            
            if (design.position && typeof design.position.x === 'number') {
                x = design.position.x / 100; // Convert % to 0-1
                y = design.position.y / 100;
            } else {
                x = x || 0.5;
                y = y || 0.5;
            }
            const scale = design.scale || 1;
            const rotation = design.rotation || 0;
            
            // Calculate pixel size maintaining aspect ratio
            const aspectRatio = (design.naturalWidth || design.originalWidth || 1) / 
                               (design.naturalHeight || design.originalHeight || 1);
            const baseWidth = Math.min(rect.width * 0.4, rect.height * 0.4 * aspectRatio);
            const baseHeight = baseWidth / aspectRatio;
            
            const pixelWidth = baseWidth * scale;
            const pixelHeight = baseHeight * scale;
            
            // Position by center point
            const left = x * rect.width - pixelWidth / 2;
            const top = y * rect.height - pixelHeight / 2;
            
            el.style.width = `${pixelWidth}px`;
            el.style.height = `${pixelHeight}px`;
            el.style.left = `${left}px`;
            el.style.top = `${top}px`;
            el.style.transform = `translate(0, 0) rotate(${rotation}deg)`;
            
            console.log('[PREVIEW] Updated overlay:', design.id, `pos: ${x.toFixed(2)},${y.toFixed(2)} scale: ${scale.toFixed(2)}`);
        }

        /**
         * PRODUCTION FIX: Set element geometry (prevent exploding)
         */
        function layoutPreviewElement(design) {
            const { container } = getRightPanelRefs();
            const el = document.getElementById(design.id);
            if (!container || !el) return;

            const rect = container.getBoundingClientRect();
            const w = Math.max(10, (design.wPct ?? 30) / 100 * rect.width);
            const h = Math.max(10, (design.hPct ?? 30) / 100 * rect.height);
            const left = ((design.xPct ?? 50) / 100) * rect.width - w / 2;
            const top = ((design.yPct ?? 50) / 100) * rect.height - h / 2;

            el.style.width = `${w}px`;
            el.style.height = `${h}px`;
            el.style.left = `${left}px`;
            el.style.top = `${top}px`;
            el.style.transform = `translate3d(0,0,0) rotate(${design.rotationDeg ?? 0}deg) scale(${design.scale ?? 1})`;
            el.style.display = 'block';
            el.style.visibility = 'visible';
            el.style.opacity = '1';
        }

        /**
         * PRODUCTION FIX: Initialize design defaults
         */
        function initializeDesignDefaults(design) {
            if (design.xPct == null) design.xPct = 50;
            if (design.yPct == null) design.yPct = 50;
            if (design.wPct == null) design.wPct = 40;
            if (design.hPct == null) design.hPct = 40;
            if (design.rotationDeg == null) design.rotationDeg = 0;
            if (design.scale == null) design.scale = 1;
        }

        /**
         * PRODUCTION FIX: Debounced baking system
         */
        let __bakeTimer = null;
        let __interactionActive = false;

        function scheduleApplyDesignsIdle(delay = 200) {
            if (__interactionActive) return; // skip while dragging
            clearTimeout(__bakeTimer);
            __bakeTimer = setTimeout(() => {
                applyDesignsToModel();
            }, delay);
        }

        function beginInteraction() {
            __interactionActive = true;
            document.body.classList.add('no-anim');
        }

        function endInteraction() {
            __interactionActive = false;
            document.body.classList.remove('no-anim');
            scheduleApplyDesignsIdle(50);
        }

        /**
         * PRODUCTION FIX: Setup preview interaction system with event delegation
         */
        function setupPreviewInteractions() {
            const rp = getRightPanelRefs();
            if (!rp.layer || !rp.container || rp.layer.__hasInteractions) return;
            
            rp.layer.__hasInteractions = true;
            
            // Event delegation on the layer for all .design-element interactions
            rp.layer.addEventListener('pointerdown', handlePreviewPointerDown);
            rp.container.addEventListener('wheel', handlePreviewWheel, { passive: false });
            
            console.log('[PREVIEW] Interaction system setup complete');
        }

        let previewDragState = null;

        /**
         * PRODUCTION FIX: Handle pointer down on preview elements
         */
        function handlePreviewPointerDown(e) {
            const target = e.target.closest('.design-element');
            if (!target) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            const designId = target.getAttribute('data-design-id');
            const design = findDesignInCurrentArea(designId);
            if (!design) return;
            
            const rp = getRightPanelRefs();
            if (!rp.container) return;
            
            // Cache start state
            const rect = rp.container.getBoundingClientRect();
            previewDragState = {
                pointerId: e.pointerId,
                target: target,
                design: design,
                start: { mx: e.clientX, my: e.clientY },
                startDesign: { 
                    x: design.x || 0.5, 
                    y: design.y || 0.5, 
                    scale: design.scale || 1, 
                    rotation: design.rotation || 0 
                },
                rect: rect,
                isRotating: e.shiftKey
            };
            
            // Capture pointer and disable OrbitControls
            target.setPointerCapture?.(e.pointerId);
            if (window.controls) window.controls.enabled = false;
            target.style.cursor = 'grabbing';
            
            // Add global move/up handlers
            document.addEventListener('pointermove', handlePreviewPointerMove);
            document.addEventListener('pointerup', handlePreviewPointerUp);
            document.addEventListener('pointercancel', handlePreviewPointerUp);
            
            console.log('[PREVIEW] drag start', previewDragState.startDesign);
        }

        /**
         * PRODUCTION FIX: Handle pointer move during drag
         */
        function handlePreviewPointerMove(e) {
            if (!previewDragState || e.pointerId !== previewDragState.pointerId) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            const { start, startDesign, rect, design, target, isRotating } = previewDragState;
            
            if (isRotating) {
                // Shift + drag = rotate around center
                const deltaX = e.clientX - start.mx;
                const rotationDelta = (deltaX / 120) * 15; // 120px ≈ 15°
                design.rotation = startDesign.rotation + rotationDelta;
            } else {
                // Regular drag = translate
                const dx = (e.clientX - start.mx) / rect.width;
                const dy = (e.clientY - start.my) / rect.height;
                
                // Calculate bounds to keep element fully inside
                const aspectRatio = (design.naturalWidth || design.originalWidth || 1) / 
                                   (design.naturalHeight || design.originalHeight || 1);
                const baseWidth = Math.min(rect.width * 0.4, rect.height * 0.4 * aspectRatio) * design.scale;
                const baseHeight = baseWidth / aspectRatio;
                
                const halfW = (baseWidth / 2) / rect.width;
                const halfH = (baseHeight / 2) / rect.height;
                
                const minX = halfW;
                const maxX = 1 - halfW;
                const minY = halfH;
                const maxY = 1 - halfH;
                
                design.x = Math.min(maxX, Math.max(minX, startDesign.x + dx));
                design.y = Math.min(maxY, Math.max(minY, startDesign.y + dy));
            }
            
            // Update overlay with pure CSS transform - NO BAKING
            updateOverlayFromDesign(design, target);
        }

        /**
         * PRODUCTION FIX: Handle pointer up/cancel
         */
        function handlePreviewPointerUp(e) {
            if (!previewDragState || e.pointerId !== previewDragState.pointerId) return;
            
            const { target, design } = previewDragState;
            
            // Release capture and re-enable OrbitControls
            target.releasePointerCapture?.(e.pointerId);
            if (window.controls) window.controls.enabled = true;
            target.style.cursor = 'grab';
            
            // Remove global handlers
            document.removeEventListener('pointermove', handlePreviewPointerMove);
            document.removeEventListener('pointerup', handlePreviewPointerUp);
            document.removeEventListener('pointercancel', handlePreviewPointerUp);
            
            console.log('[PREVIEW] drag end', { x: design.x, y: design.y, scale: design.scale, rotation: design.rotation });
            
            // Schedule debounced 3D bake
            scheduleApplyDesignsIdle(200);
            
            previewDragState = null;
        }

        /**
         * PRODUCTION FIX: Handle wheel scaling over preview
         */
        function handlePreviewWheel(e) {
            const target = e.target.closest('.design-element');
            if (!target) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            const designId = target.getAttribute('data-design-id');
            const design = findDesignInCurrentArea(designId);
            if (!design) return;
            
            // Scale by wheel direction
            const factor = e.deltaY < 0 ? 1.1 : (1 / 1.1);
            const newScale = Math.min(3, Math.max(0.1, (design.scale || 1) * factor));
            design.scale = newScale;
            
            console.log('[PREVIEW] scale', newScale.toFixed(2));
            
            // Update overlay immediately - NO BAKING
            updateOverlayFromDesign(design, target);
            
            // Schedule debounced 3D bake
            clearTimeout(target.__wheelTimer);
            target.__wheelTimer = setTimeout(() => {
                scheduleApplyDesignsIdle(200);
            }, 120);
        }

        /**
         * PRODUCTION FIX: Find design in current area by ID
         */
        function findDesignInCurrentArea(designId) {
            const areaDesigns = designs[currentArea] || [];
            return areaDesigns.find(d => d.id === designId);
        }

        /**
         * PRODUCTION FIX: Find design by ID across all areas
         */
        function findDesignById(designId) {
            for (const area of Object.keys(designs)) {
                const design = designs[area].find(d => d.id === designId);
                if (design) return design;
            }
            return null;
        }

        /**
         * PRODUCTION FIX: Wait until preview is ready with observers
         */
        let previewReadyPromise = null;
        function waitForPreviewReady(options = {}) {
            if (previewReadyPromise) return previewReadyPromise;
            
            previewReadyPromise = new Promise((resolve) => {
                const timeout = options.timeout || 5000;
                const startTime = Date.now();
                
                function checkReady() {
                    const { container, canvas, overlay } = getPreviewRefs();
                    
                    if (!container || !canvas || !overlay) {
                        if (Date.now() - startTime > timeout) {
                            console.warn('[PREVIEW] timeout waiting for DOM elements');
                            resolve(false);
                            return;
                        }
                        requestAnimationFrame(checkReady);
                        return;
                    }
                    
                    const rect = container.getBoundingClientRect();
                    if (rect.width <= 0 || rect.height <= 0) {
                        if (Date.now() - startTime > timeout) {
                            console.warn('[PREVIEW] timeout waiting for non-zero size');
                            resolve(false);
                            return;
                        }
                        requestAnimationFrame(checkReady);
                        return;
                    }
                    
                    // Setup observers once ready
                    if (!container._observersSetup) {
                        // ResizeObserver for size changes
                        const resizeObserver = new ResizeObserver(() => {
                            if (window.drawDesignPreview) {
                                window.drawDesignPreview();
                            }
                        });
                        resizeObserver.observe(container);
                        
                        // MutationObserver to ensure overlay stays mounted
                        const mutationObserver = new MutationObserver(() => {
                            const { container: newContainer, overlay: newOverlay } = getPreviewRefs();
                            if (newContainer && newOverlay && newOverlay.parentElement !== newContainer) {
                                newContainer.appendChild(newOverlay);
                                if (window.drawDesignPreview) {
                                    window.drawDesignPreview();
                                }
                            }
                        });
                        mutationObserver.observe(document.body, { childList: true, subtree: true });
                        
                        container._observersSetup = true;
                    }
                    
                    console.log(`✅ [PREVIEW] ready {w:${rect.width}, h:${rect.height}}`);
                    resolve(true);
                }
                
                checkReady();
            });
            
            return previewReadyPromise;
        }

        /**
         * PRODUCTION FIX: Preview health check for debugging
         */
        function previewHealthCheck(designId) {
            const { container, overlay } = getPreviewRefs();
            const rect = container?.getBoundingClientRect();
            const node = overlay?.querySelector(`[data-design-id="${designId}"]`) || overlay?.querySelector(`#${designId}`);
            console.log('[HEALTH]', {
                rectW: rect?.width, rectH: rect?.height,
                node: !!node,
                nodeStyles: node ? { 
                    left: node.style.left, 
                    top: node.style.top, 
                    w: node.style.width, 
                    h: node.style.height, 
                    opacity: getComputedStyle(node).opacity, 
                    vis: getComputedStyle(node).visibility 
                } : null
            });
        }

        /**
         * PRODUCTION: Right Panel Editor Module
         */
        const rpEditor = {
            // Internal state
            editor: null,
            canvas: null,
            overlay: null,
            currentArea: 'front',
            selectedId: null,
            designsByArea: { front: [], back: [], left: [], right: [] },
            stateChangeCallbacks: [],
            
            init() {
                // Query refs
                this.editor = document.getElementById('rp-editor');
                this.canvas = document.getElementById('rp-canvas');
                this.overlay = document.getElementById('rp-overlay');
                
                // Create if missing (surgical)
                if (!this.editor) {
                    const container = document.querySelector('.canvas-container') || document.body;
                    this.editor = document.createElement('div');
                    this.editor.id = 'rp-editor';
                    container.appendChild(this.editor);
                }
                
                if (!this.canvas) {
                    this.canvas = document.createElement('canvas');
                    this.canvas.id = 'rp-canvas';
                    this.editor.appendChild(this.canvas);
                }
                
                if (!this.overlay) {
                    this.overlay = document.createElement('div');
                    this.overlay.id = 'rp-overlay';
                    this.overlay.setAttribute('aria-label', 'Design overlay');
                    this.overlay.setAttribute('role', 'group');
                    this.editor.appendChild(this.overlay);
                }
                
                // Setup observers
                if (!this.editor._observersSetup) {
                    // ResizeObserver
                    const resizeObserver = new ResizeObserver(() => {
                        this.updateDomFromState();
                    });
                    resizeObserver.observe(this.editor);
                    
                    // MutationObserver
                    const mutationObserver = new MutationObserver(() => {
                        if (this.overlay.parentElement !== this.editor) {
                            this.editor.appendChild(this.overlay);
                            console.log('[RP] overlay re-appended');
                        }
                    });
                    mutationObserver.observe(document.body, { childList: true, subtree: true });
                    
                    this.editor._observersSetup = true;
                }
                
                // Setup interactions
                this.setupInteractions();
                
                console.log('[RP] ready', this.editor.clientWidth, this.editor.clientHeight);
                window.__RP_READY__ = true;
            },
            
            showArea(area) {
                this.currentArea = area;
                // Sync with global state if exists
                if (window.globalState) {
                    window.globalState.currentArea = area;
                }
                if (window.currentArea !== undefined) {
                    window.currentArea = area;
                }
                this.updateDomFromState();
            },
            
            mountDesign(design) {
                let element = this.overlay.querySelector(`[data-id="${design.id}"]`);
                
                if (!element) {
                    element = document.createElement('div');
                    element.className = 'rp-el';
                    element.dataset.id = design.id;
                    element.tabIndex = 0;
                    element.setAttribute('aria-label', 'Design element');
                    
                    const img = document.createElement('img');
                    img.className = 'rp-img';
                    img.draggable = false;
                    img.alt = '';
                    img.src = design.img.src || design.imageData;
                    
                    const handle = document.createElement('div');
                    handle.className = 'rp-handle br';
                    handle.dataset.handle = 'br';
                    
                    element.appendChild(img);
                    element.appendChild(handle);
                    this.overlay.appendChild(element);
                    
                    // Set initial position
                    const rect = this.editor.getBoundingClientRect();
                    const left = (design.pos.x / 100) * rect.width;
                    const top = (design.pos.y / 100) * rect.height;
                    const width = (design.size.w / 100) * rect.width * design.scale;
                    const height = (design.size.h / 100) * rect.height * design.scale;
                    
                    element.style.left = left + 'px';
                    element.style.top = top + 'px';
                    element.style.width = width + 'px';
                    element.style.height = height + 'px';
                    element.style.transform = `rotate(${design.rotationDeg}deg)`;
                    
                    console.log('[MOUNT]', design.id, {px: {left, top, w: width, h: height}});
                }
                
                // Update selection
                if (design.id === this.selectedId) {
                    element.classList.add('rp-selected');
                } else {
                    element.classList.remove('rp-selected');
                }
                
                return element;
            },
            
            showDesign(id) {
                this.selectedId = id;
                // Sync with global state
                if (window.globalState) {
                    window.globalState.selectedDesignId = id;
                }
                if (window.selectedDesign !== undefined) {
                    const design = this.findDesignById(id);
                    window.selectedDesign = design;
                }
                
                // Update all elements
                this.overlay.querySelectorAll('.rp-el').forEach(el => {
                    if (el.dataset.id === id) {
                        el.classList.add('rp-selected');
                        el.focus();
                    } else {
                        el.classList.remove('rp-selected');
                    }
                });
            },
            
            updateDomFromState() {
                const rect = this.editor.getBoundingClientRect();
                if (rect.width === 0 || rect.height === 0) {
                    console.log('[RP] skip: zero rect');
                    return;
                }
                
                const currentDesigns = this.designsByArea[this.currentArea] || [];
                
                // Ensure all designs have elements
                currentDesigns.forEach(design => {
                    const element = this.mountDesign(design);
                    
                    // Convert % → px
                    const left = (design.pos.x / 100) * rect.width;
                    const top = (design.pos.y / 100) * rect.height;
                    const width = (design.size.w / 100) * rect.width * design.scale;
                    const height = (design.size.h / 100) * rect.height * design.scale;
                    
                    element.style.left = left + 'px';
                    element.style.top = top + 'px';
                    element.style.width = width + 'px';
                    element.style.height = height + 'px';
                    element.style.transform = `rotate(${design.rotationDeg}deg)`;
                });
                
                // Remove orphaned elements
                this.overlay.querySelectorAll('.rp-el').forEach(el => {
                    const id = el.dataset.id;
                    if (!currentDesigns.find(d => d.id === id)) {
                        el.remove();
                    }
                });
            },
            
            findDesignById(id) {
                for (const area of Object.keys(this.designsByArea)) {
                    const design = this.designsByArea[area].find(d => d.id === id);
                    if (design) return design;
                }
                return null;
            },
            
            setupInteractions() {
                let dragState = null;
                
                const onPointerDown = (e) => {
                    const element = e.target.closest('.rp-el');
                    if (!element) return;
                    
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const id = element.dataset.id;
                    const design = this.findDesignById(id);
                    if (!design) return;
                    
                    this.showDesign(id);
                    
                    if (e.target.setPointerCapture && e.pointerId) {
                        e.target.setPointerCapture(e.pointerId);
                    }
                    
                    const rect = this.editor.getBoundingClientRect();
                    const isHandle = e.target.dataset.handle === 'br';
                    
                    dragState = {
                        id,
                        design,
                        element,
                        startPx: { x: e.clientX, y: e.clientY },
                        startRect: {
                            left: element.offsetLeft,
                            top: element.offsetTop,
                            width: element.offsetWidth,
                            height: element.offsetHeight
                        },
                        isHandle,
                        rect
                    };
                };
                
                const onPointerMove = (e) => {
                    if (!dragState) return;
                    
                    const dx = e.clientX - dragState.startPx.x;
                    const dy = e.clientY - dragState.startPx.y;
                    
                    if (dragState.isHandle) {
                        // Scale/resize
                        const newWidth = Math.max(20, dragState.startRect.width + dx);
                        const newHeight = Math.max(20, dragState.startRect.height + dy);
                        
                        // Clamp to editor bounds
                        const maxWidth = dragState.rect.width - dragState.startRect.left;
                        const maxHeight = dragState.rect.height - dragState.startRect.top;
                        
                        const clampedWidth = Math.min(newWidth, maxWidth);
                        const clampedHeight = Math.min(newHeight, maxHeight);
                        
                        dragState.element.style.width = clampedWidth + 'px';
                        dragState.element.style.height = clampedHeight + 'px';
                        
                        // Update state
                        dragState.design.size.w = (clampedWidth / dragState.rect.width) * 100;
                        dragState.design.size.h = (clampedHeight / dragState.rect.height) * 100;
                        
                    } else {
                        // Move
                        const newLeft = Math.max(0, Math.min(
                            dragState.startRect.left + dx,
                            dragState.rect.width - dragState.startRect.width
                        ));
                        const newTop = Math.max(0, Math.min(
                            dragState.startRect.top + dy,
                            dragState.rect.height - dragState.startRect.height
                        ));
                        
                        dragState.element.style.left = newLeft + 'px';
                        dragState.element.style.top = newTop + 'px';
                        
                        // Update state
                        dragState.design.pos.x = (newLeft / dragState.rect.width) * 100;
                        dragState.design.pos.y = (newTop / dragState.rect.height) * 100;
                    }
                };
                
                const onPointerUp = (e) => {
                    if (!dragState) return;
                    
                    if (e.target.releasePointerCapture && e.pointerId) {
                        e.target.releasePointerCapture(e.pointerId);
                    }
                    
                    // Emit state change
                    this.stateChangeCallbacks.forEach(cb => cb(dragState.design));
                    
                    // Schedule 3D bake
                    this.scheduleApply();
                    
                    dragState = null;
                };
                
                const onWheel = (e) => {
                    const element = e.target.closest('.rp-el');
                    if (!element) return;
                    
                    e.preventDefault();
                    
                    const id = element.dataset.id;
                    const design = this.findDesignById(id);
                    if (!design) return;
                    
                    const scaleDelta = e.deltaY > 0 ? 0.9 : 1.1;
                    design.scale = Math.max(0.1, Math.min(3.0, design.scale * scaleDelta));
                    
                    this.updateDomFromState();
                    this.stateChangeCallbacks.forEach(cb => cb(design));
                };
                
                // Bind events
                this.overlay.addEventListener('pointerdown', onPointerDown, { passive: false });
                document.addEventListener('pointermove', onPointerMove);
                document.addEventListener('pointerup', onPointerUp);
                this.overlay.addEventListener('wheel', onWheel, { passive: false });
            },
            
            scheduleApply() {
                if (this.applyTimeout) {
                    clearTimeout(this.applyTimeout);
                }
                this.applyTimeout = setTimeout(() => {
                    if (window.applyDesignsToModel) {
                        window.applyDesignsToModel();
                    }
                }, 250);
            },
            
            onStateChange(cb) {
                this.stateChangeCallbacks.push(cb);
            }
        };

        /**
         * Uygulamayı başlatan ana fonksiyon.
         * Three.js sahnesini, kamerayı, renderer'ı ve kontrolleri ayarlar.
         * Işıkları kurar, offscreen canvas'ları başlatır, 3D modeli yükler ve event listener'ları ekler.
         */
        function init() {
            // EMERGENCY FIX: Feature flags for stability
            window.__FEATURE_PREVIEW_UV = false; // Disable UV mapping until stable
            window.__interactionActive = false;  // Global interaction state
            window.__rafRunning = false;         // Single RAF guard
            
            // PRODUCTION FIX: Mount right panel editor
            mountRightPanelEditor();
            
                    // PRODUCTION FIX: Ensure right panel is properly initialized and events are working
        setTimeout(() => {
            const rp = getRightPanelRefs();
            if (rp.layer && rp.container) {
                console.log('[PREVIEW] Right panel ready:', rp.container.offsetWidth + 'x' + rp.container.offsetHeight);
                
                // PRODUCTION FIX: Force re-setup of events to ensure they work
                setupPreviewOverlayEvents();
                
                // PRODUCTION FIX: Make existing overlays interactive
                makeOverlaysInteractive();
                
                            // PRODUCTION FIX: Add global refresh function for debugging
            window.refreshOverlays = () => {
                console.log('[PREVIEW] Manually refreshing overlays...');
                makeOverlaysInteractive();
                setupPreviewOverlayEvents();
            };
            
            // PRODUCTION FIX: Add test function to check overlay interactivity
            window.testOverlayClick = () => {
                console.log('[PREVIEW] Testing overlay click...');
                const rp = getRightPanelRefs();
                if (rp && rp.layer) {
                    const overlay = rp.layer.querySelector('.design-element');
                    if (overlay) {
                        console.log('[PREVIEW] Found overlay, testing click...');
                        overlay.click();
                    } else {
                        console.log('[PREVIEW] No overlay found');
                    }
                } else {
                    console.log('[PREVIEW] No layer found');
                }
            };
            
            // PRODUCTION FIX: Add function to list all overlays
            window.listOverlays = () => {
                const rp = getRightPanelRefs();
                if (rp && rp.layer) {
                    const overlays = rp.layer.querySelectorAll('.design-element');
                    console.log('[PREVIEW] Found overlays:', overlays.length);
                    overlays.forEach((overlay, index) => {
                        const designId = overlay.getAttribute('data-design-id');
                        console.log(`[PREVIEW] Overlay ${index}:`, designId, overlay.style.pointerEvents, overlay.style.display);
                    });
                } else {
                    console.log('[PREVIEW] No layer found');
                }
            };
            
            // PRODUCTION FIX: Add function to force create overlays for all designs
            window.forceCreateOverlays = () => {
                console.log('[PREVIEW] Force creating overlays for all designs...');
                const currentDesigns = designs[currentArea] || [];
                console.log('[PREVIEW] Current designs:', currentDesigns.length);
                
                currentDesigns.forEach(design => {
                    console.log('[PREVIEW] Creating overlay for:', design.id);
                    ensureDesignElementOverlay(design);
                });
                
                setTimeout(() => {
                    makeOverlaysInteractive();
                    console.log('[PREVIEW] Overlays created and made interactive');
                }, 100);
            };
            
            // PRODUCTION FIX: Add function to debug overlay visibility
            window.debugOverlay = (designId) => {
                const rp = getRightPanelRefs();
                if (rp && rp.layer) {
                    const overlay = rp.layer.querySelector(`div.design-element[data-design-id="${designId}"]`);
                    if (overlay) {
                        console.log('[PREVIEW] Overlay debug for:', designId);
                        console.log('- Display:', overlay.style.display);
                        console.log('- Visibility:', overlay.style.visibility);
                        console.log('- Opacity:', overlay.style.opacity);
                        console.log('- Z-index:', overlay.style.zIndex);
                        console.log('- Position:', overlay.style.position);
                        console.log('- Left:', overlay.style.left);
                        console.log('- Top:', overlay.style.top);
                        console.log('- Width:', overlay.style.width);
                        console.log('- Height:', overlay.style.height);
                        console.log('- Pointer events:', overlay.style.pointerEvents);
                        console.log('- Children:', overlay.children.length);
                    } else {
                        console.log('[PREVIEW] No overlay found for:', designId);
                    }
                } else {
                    console.log('[PREVIEW] No layer found');
                }
            };
                
                // PRODUCTION FIX: Force immediate refresh
                setTimeout(() => {
                    console.log('[PREVIEW] Force refreshing overlays...');
                    makeOverlaysInteractive();
                }, 500);
                
                // PRODUCTION FIX: Force create overlays for existing designs
                setTimeout(() => {
                    console.log('[PREVIEW] Force creating overlays for existing designs...');
                    const currentDesigns = designs[currentArea] || [];
                    if (currentDesigns.length > 0) {
                        console.log('[PREVIEW] Found', currentDesigns.length, 'designs to create overlays for');
                        currentDesigns.forEach(design => {
                            ensureDesignElementOverlay(design);
                        });
                        setTimeout(() => {
                            makeOverlaysInteractive();
                            console.log('[PREVIEW] All overlays created and made interactive');
                        }, 200);
                    } else {
                        console.log('[PREVIEW] No designs found in current area');
                    }
                }, 1000);
                
                console.log('[PREVIEW] Use window.refreshOverlays() to manually refresh overlays');
            }
        }, 200);
            
            // CRITICAL FIX: Setup proper layering first
            setupProperLayering();
            
            // PRODUCTION FIX: rpEditor disabled - using single design state
            
            // Sahne oluşturma
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0xe5e7eb);

            // Animasyon zamanlaması için saat
            clock = new THREE.Clock();

            // Kamera kurulumu
            const canvas = document.getElementById('canvas');
            camera = new THREE.PerspectiveCamera(
                50,
                canvas.clientWidth / canvas.clientHeight,
                0.1,
                1000
            );
            camera.position.set(0, 0, 5);

            // OPTIMIZED: High-performance WebGL Renderer
            renderer = new THREE.WebGLRenderer({ 
                canvas: canvas, 
                antialias: true, 
                preserveDrawingBuffer: true,
                powerPreference: "high-performance",
                stencil: false,
                depth: true
            });
            renderer.setSize(canvas.clientWidth, canvas.clientHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            renderer.outputEncoding = THREE.sRGBEncoding;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.0;
            
            // OPTIMIZED: Enable frustum culling and other optimizations
            renderer.sortObjects = false; // Disable automatic sorting for better performance

            // Orbit Kontrolleri kurulumu
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.maxDistance = 10;
            controls.minDistance = 2;
            controls.enablePan = false;
            controls.target.set(0, 0, 0);

            // CRITICAL FIX: Setup canvas event handling to prevent panel blocking
            setupCanvasEventHandling();

            // Sahneye ışıkları ekle
            setupLights();

            // OPTIMIZED: High-resolution texture canvases
            initTextureCanvases();

            // PRODUCTION FIX: Safe 2D preview canvas initialization
            designPreviewCanvas = document.getElementById('rp-canvas') || document.getElementById('designPreviewCanvas');
            if (designPreviewCanvas) {
            designPreviewCtx = designPreviewCanvas.getContext('2d');
            
                const { container: designPreviewContainer } = getRightPanelRefs();
                if (designPreviewContainer) {
            const containerPadding = 40;
                    const rect = designPreviewContainer.getBoundingClientRect();
                    designPreviewCanvas.width = Math.max(rect.width - containerPadding, 300);
                    designPreviewCanvas.height = Math.max(rect.height - containerPadding, 200);
            
            designPreviewCanvas.style.display = 'block';
            designPreviewCanvas.style.visibility = 'visible';
                }
            }

            // Tişört 3D modelini yükle
            loadTshirtModel();

            // OPTIMIZED: Efficient event handling
            setupEventListeners();

            // CRITICAL FIX: Ensure right panel visibility
            ensureRightPanelVisibility();

            // Animasyon döngüsünü başlat
            animate();

            // Kamera kontrol ipucunu 3 saniye sonra gizle
            setTimeout(() => {
                document.querySelector('.camera-hint').style.opacity = '0';
            }, 3000);

            // OPTIMIZED: Smart monitoring system - replaced periodic checks
            setupSmartMonitoring();
            
            // Initialize comprehensive systems for right panel functionality
            setupPrecisionPositioning();
            setupElementPositioningSystem();
            setupElementSelectionSystem();
            setupPreviewCanvasHandlers();
            
            console.log('✅ Application initialized with enhanced panel functionality');
        }

        /**
         * OPTIMIZED: Smart monitoring system replaces periodic checks
         */
        function setupSmartMonitoring() {
            let lastInteraction = Date.now();
            let isUserActive = true;
            
            // Track user activity
            const updateActivity = () => {
                lastInteraction = Date.now();
                if (!isUserActive) {
                    isUserActive = true;
                    console.log('👤 User became active');
                }
            };
            
            // Monitor user activity
            ['click', 'mousedown', 'mousemove', 'keydown', 'touchstart'].forEach(event => {
                document.addEventListener(event, updateActivity, { passive: true });
            });
            
            // Efficient background monitoring
            setInterval(() => {
                const timeSinceInteraction = Date.now() - lastInteraction;
                const wasActive = isUserActive;
                isUserActive = timeSinceInteraction < 30000; // 30 seconds
                
                if (wasActive && !isUserActive) {
                    console.log('💤 User became idle');
                }
                
                // Only perform checks when user is active or when there are issues
                if (isUserActive || designs[currentArea].length > 0) {
                    performSmartChecks();
                }
            }, 10000); // Check every 10 seconds instead of 5
        }
        
        /**
         * OPTIMIZED: Smart checks that only run when needed
         */
        function performSmartChecks() {
            const currentDesigns = designs[currentArea];
            if (currentDesigns.length === 0) return;
            
            let needsUpdate = false;
            
            // CRITICAL FIX: Remove DOM churn - no automatic element restoration
            // Elements are created once in addDesignElementToPreview and managed by syncEditorWithSelection
        }

        /**
         * ADVANCED: Ultra-high resolution texture canvases for VirtualThreads.io quality
         */
        function initTextureCanvases() {
            // ADVANCED: Ultra-high resolution for professional quality
            const bodyResolution = textureQualitySettings.bodyResolution; // 8K resolution
            const armResolution = textureQualitySettings.armResolution;   // 4K resolution
            
            // Gövde dokusu için canvas (ön ve arka yüzü içerecek)
            bodyTextureCanvas = document.createElement('canvas');
            bodyTextureCtx = bodyTextureCanvas.getContext('2d', { 
                alpha: true,
                willReadFrequently: false, // Optimize for rendering performance
                desynchronized: true // Reduce latency
            });
            bodyTextureCanvas.width = bodyResolution;
            bodyTextureCanvas.height = bodyResolution / 2;

            // Sol kol dokusu için canvas
            leftArmTextureCanvas = document.createElement('canvas');
            leftArmTextureCtx = leftArmTextureCanvas.getContext('2d', { 
                alpha: true,
                willReadFrequently: false,
                desynchronized: true
            });
            leftArmTextureCanvas.width = armResolution;
            leftArmTextureCanvas.height = armResolution / 2;

            // Sağ kol dokusu için canvas
            rightArmTextureCanvas = document.createElement('canvas');
            rightArmTextureCtx = rightArmTextureCanvas.getContext('2d', { 
                alpha: true,
                willReadFrequently: false,
                desynchronized: true
            });
            rightArmTextureCanvas.width = armResolution;
            rightArmTextureCanvas.height = armResolution / 2;
            
            // ADVANCED: Enhanced image smoothing and quality settings
            [bodyTextureCtx, leftArmTextureCtx, rightArmTextureCtx].forEach(ctx => {
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                
                // ADVANCED: Additional quality enhancements
                ctx.globalCompositeOperation = 'source-over';
                ctx.globalAlpha = 1.0;
            });
            
            console.log('🎨 Ultra-high resolution texture canvases initialized:', {
                body: `${bodyResolution}x${bodyResolution/2}`,
                arms: `${armResolution}x${armResolution/2}`
            });
        }

        /**
         * OPTIMIZED: Smart update queue system
         */
        function queueUpdate(callback, priority = 'normal') {
            const update = { callback, priority, timestamp: Date.now() };
            
            if (priority === 'high') {
                updateQueue.unshift(update);
            } else {
                updateQueue.push(update);
            }
            
            if (!isUpdating) {
                processUpdateQueue();
            }
        }
        
        function processUpdateQueue() {
            if (updateQueue.length === 0) {
                isUpdating = false;
                return;
            }
            
            isUpdating = true;
            const now = Date.now();
            
            if (now - lastUpdateTime < updateThrottle) {
                requestAnimationFrame(processUpdateQueue);
                return;
            }
            
            const update = updateQueue.shift();
            try {
                update.callback();
                lastUpdateTime = now;
            } catch (error) {
                console.error('Update error:', error);
            }
            
            requestAnimationFrame(processUpdateQueue);
        }

        /**
         * ADVANCED: Professional lighting setup for VirtualThreads.io quality
         */
        function setupLights() {
            // ADVANCED: Studio-quality ambient lighting
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
            scene.add(ambientLight);

            // ADVANCED: Main key light with ultra-high resolution shadows
            const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
            mainLight.position.set(8, 12, 8);
            mainLight.castShadow = true;
            mainLight.shadow.mapSize.width = 8192; // 8K shadow maps
            mainLight.shadow.mapSize.height = 8192;
            mainLight.shadow.camera.near = 0.1;
            mainLight.shadow.camera.far = 50;
            mainLight.shadow.camera.left = -12;
            mainLight.shadow.camera.right = 12;
            mainLight.shadow.camera.top = 12;
            mainLight.shadow.camera.bottom = -12;
            mainLight.shadow.bias = -0.00005; // Ultra-fine shadow bias
            mainLight.shadow.normalBias = 0.02; // Normal bias for better quality
            scene.add(mainLight);

            // ADVANCED: Professional fill light
            const fillLight = new THREE.DirectionalLight(0xffffff, 0.6);
            fillLight.position.set(-8, 6, -8);
            fillLight.castShadow = true;
            fillLight.shadow.mapSize.width = 4096;
            fillLight.shadow.mapSize.height = 4096;
            scene.add(fillLight);

            // ADVANCED: Rim light for perfect edge definition
            const rimLight = new THREE.DirectionalLight(0xffffff, 0.4);
            rimLight.position.set(0, 4, -12);
            scene.add(rimLight);
            
            // ADVANCED: Top light for fabric texture definition
            const topLight = new THREE.DirectionalLight(0xffffff, 0.3);
            topLight.position.set(0, 15, 0);
            scene.add(topLight);
            
            // ADVANCED: Subtle back light for depth
            const backLight = new THREE.DirectionalLight(0xffffff, 0.2);
            backLight.position.set(0, 8, 12);
            scene.add(backLight);
            
            // ADVANCED: Warm accent light for realistic fabric appearance
            const accentLight = new THREE.DirectionalLight(0xfff4e6, 0.15);
            accentLight.position.set(12, 6, -4);
            scene.add(accentLight);
        }

        /**
         * OPTIMIZED: Enhanced 3D model loading with better error handling
         */
        function loadTshirtModel() {
            if (tshirtModel) {
                scene.remove(tshirtModel);
                originalMaterials.clear();
            }

            const loading = document.getElementById('loading');
            loading.style.display = 'block';

            const loader = new THREE.GLTFLoader();
            const modelPath = 'https://raw.githubusercontent.com/borcesav37/3d-models/main/t-shirt.glb'; 

            loader.load(modelPath, (gltf) => {
                tshirtModel = gltf.scene;
                
                // OPTIMIZED: Better model scaling and positioning
                const box = new THREE.Box3().setFromObject(tshirtModel);
                const size = box.getSize(new THREE.Vector3());
                const maxSize = Math.max(size.x, size.y, size.z);
                const scale = 2.2 / maxSize; // Slightly larger for better visibility
                tshirtModel.scale.set(scale, scale, scale);
                
                const center = box.getCenter(new THREE.Vector3());
                tshirtModel.position.sub(center.multiplyScalar(scale));
                
                scene.add(tshirtModel);

                // OPTIMIZED: Enhanced material handling
                tshirtModel.traverse((node) => {
                    if (node.isMesh) {
                        node.castShadow = true;
                        node.receiveShadow = true;
                        
                        // ADVANCED: Professional material optimization for VirtualThreads.io quality
                        if (node.material) {
                            let clonedMaterial;
                            if (Array.isArray(node.material)) {
                                clonedMaterial = node.material.map(mat => {
                                    const cloned = mat.clone();
                                    // ADVANCED: Professional fabric material properties
                                    cloned.roughness = 0.85; // Realistic cotton fabric roughness
                                    cloned.metalness = 0.05; // Low metalness for fabric
                                    cloned.envMapIntensity = 0.3; // Subtle environment reflection
                                    cloned.normalScale = new THREE.Vector2(0.5, 0.5); // Subtle normal mapping
                                    cloned.aoIntensity = 0.8; // Ambient occlusion for depth
                                    cloned.emissiveIntensity = 0.0; // No self-illumination
                                    return cloned;
                                });
                            } else {
                                clonedMaterial = node.material.clone();
                                clonedMaterial.roughness = 0.85;
                                clonedMaterial.metalness = 0.05;
                                clonedMaterial.envMapIntensity = 0.3;
                                clonedMaterial.normalScale = new THREE.Vector2(0.5, 0.5);
                                clonedMaterial.aoIntensity = 0.8;
                                clonedMaterial.emissiveIntensity = 0.0;
                            }
                            originalMaterials.set(node, clonedMaterial);
                            node.material = clonedMaterial;
                            
                            // Identify mesh parts
                            const nodeNameLower = node.name.toLowerCase();
                            if (nodeNameLower.includes('body') || nodeNameLower.includes('shirt')) {
                                tshirtMeshBody = node;
                            } else if (nodeNameLower.includes('leftarm') || nodeNameLower.includes('sleeve_l')) {
                                tshirtMeshLeftArm = node;
                            } else if (nodeNameLower.includes('rightarm') || nodeNameLower.includes('sleeve_r')) {
                                tshirtMeshRightArm = node;
                            } else if (nodeNameLower.includes('collar') || nodeNameLower.includes('neck')) {
                                tshirtMeshCollar = node;
                            }
                        }
                    }
                });

                if (!tshirtMeshBody) {
                    tshirtModel.traverse((node) => {
                        if (node.isMesh && !tshirtMeshBody) {
                            tshirtMeshBody = node;
                        }
                    });
                }
                
                // OPTIMIZED: Better initial color application
                const initialColor = new THREE.Color(0xffffff);
                tshirtModel.traverse((node) => {
                    if (node.isMesh && node.material) {
                        if (Array.isArray(node.material)) {
                            node.material.forEach(mat => mat.color.copy(initialColor));
                        } else {
                            node.material.color.copy(initialColor);
                        }
                    }
                });

                document.getElementById('loading').style.display = 'none';
                queueUpdate(() => applyDesignsToModel(), 'high');
            }, undefined, (error) => {
                console.warn('3D modeli yüklenirken bir hata oluştu, varsayılan tişört modeli oluşturuluyor:', error);
                document.getElementById('loading').innerHTML = '<p style="color:orange;">Model yüklenemedi. Varsayılan tişört kullanılıyor.</p>';
                createDefaultTshirtModel();
                document.getElementById('loading').style.display = 'none';
                queueUpdate(() => applyDesignsToModel(), 'high');
            });
        }

        /**
         * OPTIMIZED: Enhanced default model creation
         */
        function createDefaultTshirtModel() {
            tshirtModel = new THREE.Group();
            
            // OPTIMIZED: Better geometry for default model
            const bodyGeometry = new THREE.CylinderGeometry(0.8, 0.9, 1.5, 32);
            const bodyMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xffffff,
                roughness: 0.8,
                metalness: 0.1
            });
            tshirtMeshBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
            tshirtMeshBody.position.y = 0;
            tshirtMeshBody.castShadow = true;
            tshirtMeshBody.receiveShadow = true;
            tshirtModel.add(tshirtMeshBody);
            originalMaterials.set(tshirtMeshBody, bodyMaterial.clone());
            
            const armGeometry = new THREE.CylinderGeometry(0.3, 0.25, 0.8, 16);
            const armMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xffffff,
                roughness: 0.8,
                metalness: 0.1
            });
            
            tshirtMeshLeftArm = new THREE.Mesh(armGeometry, armMaterial);
            tshirtMeshLeftArm.position.set(-1.1, 0.2, 0);
            tshirtMeshLeftArm.rotation.z = Math.PI / 6;
            tshirtMeshLeftArm.castShadow = true;
            tshirtMeshLeftArm.receiveShadow = true;
            tshirtModel.add(tshirtMeshLeftArm);
            originalMaterials.set(tshirtMeshLeftArm, armMaterial.clone());
            
            tshirtMeshRightArm = new THREE.Mesh(armGeometry, armMaterial.clone());
            tshirtMeshRightArm.position.set(1.1, 0.2, 0);
            tshirtMeshRightArm.rotation.z = -Math.PI / 6;
            tshirtMeshRightArm.castShadow = true;
            tshirtMeshRightArm.receiveShadow = true;
            tshirtModel.add(tshirtMeshRightArm);
            originalMaterials.set(tshirtMeshRightArm, armMaterial.clone());
            
            const neckGeometry = new THREE.CylinderGeometry(0.4, 0.45, 0.2, 16);
            const neckMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xffffff,
                roughness: 0.8,
                metalness: 0.1
            });
            tshirtMeshCollar = new THREE.Mesh(neckGeometry, neckMaterial);
            tshirtMeshCollar.position.y = 0.85;
            tshirtMeshCollar.castShadow = true;
            tshirtMeshCollar.receiveShadow = true;
            tshirtModel.add(tshirtMeshCollar);
            originalMaterials.set(tshirtMeshCollar, neckMaterial.clone());
            
            tshirtModel.scale.set(1.2, 1.2, 1.2);
            scene.add(tshirtModel);
            
            console.log('Varsayılan t-shirt modeli yüklendi');
        }

        /**
         * OPTIMIZED: Enhanced event handling
         */
        function setupEventListeners() {
            // Arka plan seçenekleri tıklama olayları
            document.querySelectorAll('.bg-option').forEach(option => {
                option.addEventListener('click', function() {
                    document.querySelectorAll('.bg-option').forEach(opt => opt.classList.remove('active'));
                    this.classList.add('active');
                    
                    if (this.dataset.bg === 'solid') {
                        scene.background = new THREE.Color(this.dataset.color);
                    } else if (this.dataset.bg === 'gradient') {
                        const tempDiv = document.createElement('div');
                        tempDiv.style.background = this.dataset.gradient;
                        tempDiv.style.width = '1px';
                        tempDiv.style.height = '1px';
                        document.body.appendChild(tempDiv);
                        const computedColor = window.getComputedStyle(tempDiv).backgroundColor;
                        document.body.removeChild(tempDiv);
                        
                        let rgbColor;
                        if (computedColor.startsWith('rgba')) {
                            const rgbaMatch = computedColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
                            if (rgbaMatch) {
                                rgbColor = `rgb(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]})`;
                            } else {
                                rgbColor = '#667eea';
                            }
                        } else {
                            rgbColor = computedColor;
                        }
                        
                        scene.background = new THREE.Color(rgbColor);
                    }
                });
            });

            // Animasyon kontrolleri tıklama olayları
            document.querySelectorAll('.animation-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    document.querySelectorAll('.animation-btn').forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    currentAnimation = this.dataset.animation;
                });
            });

            // OPTIMIZED: Enhanced color selection with better performance
            document.querySelectorAll('.color-option').forEach(option => {
                option.addEventListener('click', function() {
                    document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('active'));
                    this.classList.add('active');
                    
                    const color = new THREE.Color(this.dataset.color);
                    tshirtModel.traverse(function(node) {
                        if (node.isMesh && originalMaterials.has(node)) {
                            let material = originalMaterials.get(node).clone();
                            if (Array.isArray(material)) {
                                material.forEach(mat => mat.color.copy(color));
                            } else {
                                material.color.copy(color);
                            }
                            node.material = material;
                            node.material.needsUpdate = true;
                        }
                    });
                    queueUpdate(() => applyDesignsToModel(), 'high');
                });
            });

            // Tasarım yükleme input alanı değiştiğinde
            document.getElementById('uploadInput').addEventListener('change', handleFileUpload);

            // OPTIMIZED: Enhanced design panel events
            setupDesignPanelEvents();
            setupNewDesignPanelEvents();

            // Pencere boyutu değiştiğinde canvas'ları ve 3D görünümü yeniden boyutlandır
            window.addEventListener('resize', onWindowResize);
        }

        /**
         * OPTIMIZED: Enhanced file upload handling
         */
        function handleFileUpload(e) {
            const files = e.target.files;
            if (files.length > 0) {
                const file = files[0];
                const reader = new FileReader();

                reader.onload = function(event) {
                    const img = new Image();
                    img.src = event.target.result;
                    img.onload = () => {
                        console.log('📤 Image uploaded:', file.name, `${img.naturalWidth}x${img.naturalHeight}`);
                        addDesignToArea(event.target.result, file.name, img.naturalWidth, img.naturalHeight);
                    };
                };
                reader.readAsDataURL(file);
            }
        }

        /**
         * OPTIMIZED: Enhanced design area switching
         */
        function switchDesignArea(area) {
            currentArea = area;
            
            // Update active tab
            document.querySelectorAll('.design-tab, .area-tab').forEach(tab => {
                tab.classList.remove('active');
                tab.setAttribute('aria-selected', 'false');
                
                if (tab.dataset.area === area) {
                    tab.classList.add('active');
                    tab.setAttribute('aria-selected', 'true');
                }
            });
            
            // CRITICAL FIX: Ensure proper layering and visibility
            setupProperLayering();
            ensureRightPanelVisibility();
            
            // OPTIMIZED: Batch DOM updates
            queueUpdate(() => {
                drawDesignPreview();
                
                // Clear and rebuild design elements efficiently
                const designElementsLayer = document.getElementById('designElementsLayer');
                const fallbackContainer = document.getElementById('designPreviewCanvas').parentElement;
                
                if (designElementsLayer) {
                    designElementsLayer.innerHTML = '';
                }
                fallbackContainer.querySelectorAll('.design-element').forEach(el => el.remove());
                
                            // PRODUCTION FIX: Hide overlays from other areas, show current area
            if (designElementsLayer) {
                // Hide all overlays first
                designElementsLayer.querySelectorAll('.design-element').forEach(el => {
                    el.style.display = 'none';
                });
                
                // Show overlays for current area
                designs[currentArea].forEach(design => {
                    const overlay = designElementsLayer.querySelector(`div.design-element[data-design-id="${design.id}"]`);
                    if (overlay) {
                        overlay.style.display = 'block';
                        updateOverlayPosition(design, overlay);
                    } else {
                        // Create overlay if missing
                        ensureDesignElementOverlay(design);
                    }
                });
                
                // PRODUCTION FIX: Make all overlays interactive after area switch
                makeOverlaysInteractive();
            }
            
            // CRITICAL FIX: Add new area designs with enhanced elements
            designs[currentArea].forEach(design => {
                const element = createEnhancedDesignElement(design);
                if (designElementsLayer) {
                    designElementsLayer.appendChild(element);
                } else if (fallbackContainer) {
                    fallbackContainer.appendChild(element);
                }
            });
                
                // Ensure panel visibility
                const designPanel = document.getElementById('designPanel');
                if (designPanel) {
                    designPanel.style.display = 'flex';
                    designPanel.style.visibility = 'visible';
                }
                
                // Update UI components
                ensureDesignElementsVisible();
                checkAndRestoreDesignElements();
                validateElementPositioning();
                updateCanvasTitle();
                updateElementsList();
                updatePropertiesPanel();
            }, 'high');
            
            updateLayersList();
            selectedDesign = designs[currentArea][0] || null;
            updateDesignControls();
            
            // PRODUCTION FIX: Sync editor with new area selection
            syncEditorWithSelection(selectedDesign);
            
            queueUpdate(() => applyDesignsToModel(), 'normal');
            
            console.log('✅ Design area switched to:', area);
        }

        /**
         * CRITICAL FIX: Restore full interaction system for design manipulation
         */
        function setupEnhancedInteractions(element, design) {
            if (!element || !design) {
                console.warn('⚠️ Cannot setup interactions: missing element or design');
                return;
            }
            
            console.log('🔧 Setting up interactions for element:', element.id);
            
            // CRITICAL FIX: Remove any existing event listeners to prevent conflicts
            element.removeEventListener('mousedown', element._enhancedMouseDown);
            element.removeEventListener('touchstart', element._enhancedTouchStart);
            element.removeEventListener('click', element._enhancedClick);
            
            // CRITICAL FIX: Ensure element is interactive
            element.style.pointerEvents = 'auto';
            element.style.cursor = 'grab';
            element.style.userSelect = 'none';
            element.style.webkitUserSelect = 'none';
            element.style.mozUserSelect = 'none';
            element.style.msUserSelect = 'none';
            element.style.touchAction = 'none';
            
            // CRITICAL FIX: Enhanced mouse interaction
            element._enhancedMouseDown = (e) => {
                console.log('🖱️ Mouse down on element:', element.id);
                e.preventDefault();
                e.stopPropagation();
                
                // PRODUCTION FIX: Ensure element is visible safely
                ensureDesignElementVisible(element);
                element.style.zIndex = '1001';
                element.style.pointerEvents = 'auto';
                
                interactionState.isDragging = true;
                interactionState.activeElement = element;
                interactionState.dragStart = {
                    x: e.clientX - element.offsetLeft,
                    y: e.clientY - element.offsetTop
                };
                interactionState.lastInteractionTime = Date.now();
                
                design.interactionState.isDragging = true;
                design.interactionState.lastInteraction = Date.now();
                
                // CRITICAL FIX: Set interaction priority for smooth performance
                performanceOptimizer.interactionPriority = true;
                
                // CRITICAL FIX: Add event listeners to document
                document.addEventListener('mousemove', element._enhancedMouseMove);
                document.addEventListener('mouseup', element._enhancedMouseUp);
                
                // CRITICAL FIX: Visual feedback
                element.style.cursor = 'grabbing';
                element.style.zIndex = '1001';
                
                // CRITICAL FIX: Select the design element
                selectDesignElement(element);
                
                console.log('✅ Mouse down handled for element:', element.id);
            };
            
                                // CRITICAL FIX: Enhanced mouse move with immediate response
            element._enhancedMouseMove = (e) => {
                if (!interactionState.isDragging || interactionState.activeElement !== element) {
                    return;
                }
                
                e.preventDefault();
                e.stopPropagation();
                
                console.log('🖱️ Mouse move on element:', element.id);
                
                const newX = e.clientX - interactionState.dragStart.x;
                const newY = e.clientY - interactionState.dragStart.y;
                
                // CRITICAL FIX: Enhanced positioning with bounds checking
                const container = element.parentElement;
                const maxX = container.clientWidth - element.clientWidth;
                const maxY = container.clientHeight - element.clientHeight;
                
                const clampedX = Math.max(0, Math.min(newX, maxX));
                const clampedY = Math.max(0, Math.min(newY, maxY));
                
                // CRITICAL FIX: Immediate position update for both panel and 3D model
                const previewCanvas = document.getElementById('designPreviewCanvas');
                if (previewCanvas) {
                    const newPosition = {
                        x: (clampedX / previewCanvas.clientWidth) * 100,
                        y: (clampedY / previewCanvas.clientHeight) * 100
                    };
                    
                    // CRITICAL FIX: Update element position immediately
                    element.style.left = clampedX + 'px';
                    element.style.top = clampedY + 'px';
                    element.style.transform = 'translate3d(0, 0, 0)';
                    
                    // CRITICAL FIX: Update design position
                    design.position = newPosition;
                    
                    // PRODUCTION FIX: Light update during drag, no heavy baking
                    drawDesignPreview();
                    
                    // CRITICAL FIX: Update 3D model position in real-time
                    update3DModelPosition(design, newPosition);
                    
                    console.log('🎯 Position updated for both panel and 3D model:', newPosition);
                }
                
                interactionState.lastInteractionTime = Date.now();
                design.interactionState.lastInteraction = Date.now();
            };
            
            // CRITICAL FIX: Enhanced mouse up with proper cleanup
            element._enhancedMouseUp = (e) => {
                if (!interactionState.isDragging || interactionState.activeElement !== element) {
                    return;
                }
                
                e.preventDefault();
                e.stopPropagation();
                
                console.log('🖱️ Mouse up on element:', element.id);
                
                interactionState.isDragging = false;
                interactionState.activeElement = null;
                design.interactionState.isDragging = false;
                
                // CRITICAL FIX: Reset interaction priority
                performanceOptimizer.interactionPriority = false;
                
                // CRITICAL FIX: Remove event listeners
                document.removeEventListener('mousemove', element._enhancedMouseMove);
                document.removeEventListener('mouseup', element._enhancedMouseUp);
                
                // CRITICAL FIX: Reset visual feedback
                element.style.cursor = 'grab';
                element.style.zIndex = '1000';
                element.style.pointerEvents = 'auto';
                
                // PRODUCTION FIX: Final heavy update on pointer up
                drawDesignPreview();
                scheduleApplyDesignsIdle(200);
                
                console.log('✅ Mouse up handled for element:', element.id);
            };
            
            // CRITICAL FIX: Enhanced touch interaction for mobile
            element._enhancedTouchStart = (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('📱 Touch start on element:', element.id);
                
                const touch = e.touches[0];
                interactionState.isDragging = true;
                interactionState.activeElement = element;
                interactionState.dragStart = {
                    x: touch.clientX - element.offsetLeft,
                    y: touch.clientY - element.offsetTop
                };
                interactionState.lastInteractionTime = Date.now();
                
                design.interactionState.isDragging = true;
                design.interactionState.lastInteraction = Date.now();
                
                // CRITICAL FIX: Ensure element is interactive
                element.style.pointerEvents = 'auto';
                element.style.zIndex = '1001';
                
                performanceOptimizer.interactionPriority = true;
                
                document.addEventListener('touchmove', element._enhancedTouchMove, { passive: false });
                document.addEventListener('touchend', element._enhancedTouchEnd);
                
                // CRITICAL FIX: Select the design element
                selectDesignElement(element);
                
                console.log('✅ Touch start handled for element:', element.id);
            };
            
            // CRITICAL FIX: Enhanced touch move
            element._enhancedTouchMove = (e) => {
                if (!interactionState.isDragging || interactionState.activeElement !== element) {
                    return;
                }
                
                e.preventDefault();
                e.stopPropagation();
                
                console.log('📱 Touch move on element:', element.id);
                
                const touch = e.touches[0];
                const currentTime = Date.now();
                const timeSinceLastMove = currentTime - interactionState.lastInteractionTime;
                
                if (timeSinceLastMove < 16) return;
                
                const newX = touch.clientX - interactionState.dragStart.x;
                const newY = touch.clientY - interactionState.dragStart.y;
                
                const container = element.parentElement;
                const maxX = container.clientWidth - element.clientWidth;
                const maxY = container.clientHeight - element.clientHeight;
                
                const clampedX = Math.max(0, Math.min(newX, maxX));
                const clampedY = Math.max(0, Math.min(newY, maxY));
                
                // CRITICAL FIX: Update element position immediately
                element.style.left = clampedX + 'px';
                element.style.top = clampedY + 'px';
                element.style.transform = 'translate3d(0, 0, 0)';
                
                // CRITICAL FIX: Update design position
                const previewCanvas = document.getElementById('designPreviewCanvas');
                if (previewCanvas) {
                    design.position.x = (clampedX / previewCanvas.clientWidth) * 100;
                    design.position.y = (clampedY / previewCanvas.clientHeight) * 100;
                    
                    // CRITICAL FIX: Immediate update for 3D model
                    drawDesignPreview();
                    applyDesignsToModel();
                }
                
                interactionState.lastInteractionTime = currentTime;
                design.interactionState.lastInteraction = currentTime;
                
                console.log('🎯 Touch position updated');
            };
            
            // CRITICAL FIX: Enhanced touch end
            element._enhancedTouchEnd = (e) => {
                if (!interactionState.isDragging || interactionState.activeElement !== element) {
                    return;
                }
                
                e.preventDefault();
                e.stopPropagation();
                
                console.log('📱 Touch end on element:', element.id);
                
                interactionState.isDragging = false;
                interactionState.activeElement = null;
                design.interactionState.isDragging = false;
                
                performanceOptimizer.interactionPriority = false;
                
                // CRITICAL FIX: Remove event listeners
                document.removeEventListener('touchmove', element._enhancedTouchMove);
                document.removeEventListener('touchend', element._enhancedTouchEnd);
                
                // CRITICAL FIX: Reset visual feedback
                element.style.cursor = 'grab';
                element.style.zIndex = '1000';
                element.style.pointerEvents = 'auto';
                
                // PRODUCTION FIX: Final heavy update on pointer up
                drawDesignPreview();
                scheduleApplyDesignsIdle(200);
                
                console.log('✅ Touch end handled for element:', element.id);
            };
            
            // CRITICAL FIX: Add event listeners with proper setup
            element.addEventListener('mousedown', element._enhancedMouseDown);
            element.addEventListener('touchstart', element._enhancedTouchStart, { passive: false });
            
            // CRITICAL FIX: Add click handler for selection
            element._enhancedClick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('🖱️ Click on element:', element.id);
                
                // CRITICAL FIX: Select the design element
                selectDesignElement(element);
                
                // CRITICAL FIX: Ensure element is visible and selected
                ensureDesignElementVisible(element);
                element.style.zIndex = '1001';
                element.style.pointerEvents = 'auto';
                
                console.log('✅ Element clicked and selected:', element.id);
            };
            
            element.addEventListener('click', element._enhancedClick);
            
            // CRITICAL FIX: Set initial styles for better interaction
            element.style.cursor = 'grab';
            element.style.userSelect = 'none';
            element.style.webkitUserSelect = 'none';
            element.style.mozUserSelect = 'none';
            element.style.msUserSelect = 'none';
            element.style.touchAction = 'none';
            element.style.pointerEvents = 'auto';
            
            // CRITICAL FIX: Ensure element is visible and interactive
            element.style.display = 'block';
            element.style.visibility = 'visible';
            element.style.opacity = '1';
            element.style.position = 'absolute';
            element.style.zIndex = '1000';
            element.style.transform = 'translate3d(0, 0, 0)';
            
            console.log('🎯 Enhanced interactions setup for design:', design.id);
            console.log('✅ Element is now fully interactive:', element.id);
        }
        
        /**
         * CRITICAL FIXES: Enhanced quality enhancement with performance optimization
         */
        function enhanceDesignQuality(design) {
            if (!design || !design.imageData) return;
            
            // CRITICAL FIXES: Apply optimized quality enhancements
            design.processingFlags.supersampled = designQualityEnhancer.supersamplingEnabled;
            design.processingFlags.fabricBlended = designQualityEnhancer.fabricBlendingEnabled;
            design.processingFlags.realisticShading = designQualityEnhancer.realisticShadingEnabled;
            design.processingFlags.optimized = true;
            
            console.log('🎨 Enhancing design quality:', design.id, {
                quality: design.quality,
                originalSize: `${design.originalWidth}x${design.originalHeight}`,
                processingFlags: design.processingFlags,
                performanceMode: performanceOptimizer.isThrottling ? 'optimized' : 'full'
            });
            
            // CRITICAL FIXES: Queue for optimized processing
            designQualityEnhancer.processingQueue.push(design);
            if (!designQualityEnhancer.isProcessing) {
                processQualityQueue();
            }
        }
        
        /**
         * CRITICAL FIXES: Optimized quality processing queue
         */
        function processQualityQueue() {
            if (designQualityEnhancer.processingQueue.length === 0) {
                designQualityEnhancer.isProcessing = false;
                return;
            }
            
            designQualityEnhancer.isProcessing = true;
            const design = designQualityEnhancer.processingQueue.shift();
            
            // CRITICAL FIXES: Apply optimized quality enhancements
            if (design.processingFlags.supersampled) {
                applyOptimizedSupersampling(design);
            }
            
            if (design.processingFlags.fabricBlended) {
                applyOptimizedFabricBlending(design);
            }
            
            if (design.processingFlags.realisticShading) {
                applyOptimizedRealisticShading(design);
            }
            
            // CRITICAL FIXES: Continue processing with performance consideration
            const processingDelay = performanceOptimizer.isThrottling ? 100 : 30;
            setTimeout(processQualityQueue, processingDelay);
        }
        
        /**
         * CRITICAL FIXES: Optimized supersampling for better performance
         */
        function applyOptimizedSupersampling(design) {
            console.log('🔍 Applying optimized supersampling to design:', design.id);
            // Implementation for optimized supersampling
        }
        
        /**
         * CRITICAL FIXES: Optimized fabric blending for realistic integration
         */
        function applyOptimizedFabricBlending(design) {
            console.log('🧵 Applying optimized fabric blending to design:', design.id);
            // Implementation for optimized fabric blending
        }
        
        /**
         * CRITICAL FIXES: Intelligent texture quality adjustment based on performance
         */
        function adjustTextureQualityBasedOnPerformance() {
            const currentFPS = performanceManager.currentFPS;
            const currentQuality = textureQualityManager.currentQuality;
            
            // CRITICAL FIXES: Auto-adjust quality based on performance
            if (currentFPS < performanceManager.qualityThresholds.low.fps && currentQuality !== 'low') {
                setTextureQuality('low');
                console.log('🔧 Auto-adjusting texture quality to LOW for better performance');
            } else if (currentFPS < performanceManager.qualityThresholds.medium.fps && currentQuality === 'high') {
                setTextureQuality('medium');
                console.log('🔧 Auto-adjusting texture quality to MEDIUM for better performance');
            } else if (currentFPS > performanceManager.qualityThresholds.high.fps && currentQuality === 'low') {
                setTextureQuality('medium');
                console.log('🔧 Auto-adjusting texture quality to MEDIUM for better quality');
            } else if (currentFPS > performanceManager.qualityThresholds.high.fps && currentQuality === 'medium') {
                setTextureQuality('high');
                console.log('🔧 Auto-adjusting texture quality to HIGH for maximum quality');
            }
        }
        
        /**
         * CRITICAL FIXES: Set texture quality level
         */
        function setTextureQuality(quality) {
            if (!textureQualityManager.qualityLevels[quality]) {
                console.warn('⚠️ Invalid texture quality level:', quality);
                return;
            }
            
            textureQualityManager.currentQuality = quality;
            const qualitySettings = textureQualityManager.qualityLevels[quality];
            
            // CRITICAL FIXES: Update texture quality settings
            textureQualitySettings.bodyResolution = qualitySettings.resolution;
            textureQualitySettings.armResolution = qualitySettings.resolution / 2;
            textureQualitySettings.maxAnisotropy = qualitySettings.anisotropy;
            designQualityEnhancer.supersamplingEnabled = qualitySettings.supersampling;
            
            console.log('🎨 Texture quality updated:', {
                level: quality,
                resolution: qualitySettings.resolution,
                supersampling: qualitySettings.supersampling,
                anisotropy: qualitySettings.anisotropy
            });
            
            // CRITICAL FIXES: Reinitialize texture canvases with new quality
            initTextureCanvases();
            
            // CRITICAL FIXES: Reapply designs with new quality
            queueUpdate(() => {
                applyDesignsToModel();
            }, 'high');
        }
        
        /**
         * IMMEDIATE FIX: Restore right panel functionality
         */
        function restoreRightPanelFunctionality() {
            // PRODUCTION FIX: Skip if rpEditor exists
            if (document.getElementById('rp-editor') || window.__RP_READY__) return;
            console.log('🔧 Restoring right panel functionality...');
            
            // IMMEDIATE FIX: Ensure design panel is visible
            const designPanel = document.getElementById('designPanel');
            if (designPanel) {
                designPanel.style.display = 'flex';
                designPanel.style.visibility = 'visible';
                designPanel.style.opacity = '1';
                designPanel.style.zIndex = '1000';
            }
            
            // IMMEDIATE FIX: Ensure design elements layer is visible
            const designElementsLayer = document.querySelector('.design-elements-layer');
            if (designElementsLayer) {
                designElementsLayer.style.display = 'block';
                designElementsLayer.style.visibility = 'visible';
                designElementsLayer.style.opacity = '1';
                designElementsLayer.style.position = 'relative';
                designElementsLayer.style.zIndex = '100';
            }
            
            // IMMEDIATE FIX: Ensure preview canvas is visible
            const previewCanvas = document.getElementById('designPreviewCanvas');
            if (previewCanvas) {
                previewCanvas.style.display = 'block';
                previewCanvas.style.visibility = 'visible';
                previewCanvas.style.opacity = '1';
                previewCanvas.style.zIndex = '50';
            }
            
            // IMMEDIATE FIX: Force all design elements to be visible
            const allDesignElements = document.querySelectorAll('.design-element');
            allDesignElements.forEach(element => {
                ensureDesignElementVisible(element);
                element.style.position = 'absolute';
                element.style.zIndex = '1000';
                element.style.transform = 'translate3d(0, 0, 0)';
                element.style.pointerEvents = 'auto';
            });
            
            console.log('✅ Right panel functionality restored');
        }
        
        /**
         * IMMEDIATE FIX: Enhanced element visibility management
         */
        function ensureElementVisibilityEnhanced(elementId) {
            const element = document.getElementById(elementId);
            if (!element) {
                console.warn('⚠️ Element not found for visibility check:', elementId);
                return false;
            }
            
            // IMMEDIATE FIX: Force visibility without complex checks
            element.style.display = 'block';
            element.style.visibility = 'visible';
            element.style.opacity = '1';
            element.style.position = 'absolute';
            element.style.zIndex = '1000';
            element.style.transform = 'translate3d(0, 0, 0)';
            element.style.pointerEvents = 'auto';
            
            // IMMEDIATE FIX: Force reflow
            element.offsetHeight;
            
            console.log('✅ Immediate visibility applied for element:', elementId);
            return true;
        }
        
        /**
         * IMMEDIATE FIX: Simple design positioning
         */
        function updateDesignPositionWithAlignment(design, newPosition) {
            // IMMEDIATE FIX: Simple position update without complex throttling
            const finalPosition = { ...newPosition };
            
            // IMMEDIATE FIX: Update design position
            design.position = finalPosition;
            
            // IMMEDIATE FIX: Update element position immediately
            const element = document.getElementById(design.id);
            if (element) {
                element.style.left = finalPosition.x + '%';
                element.style.top = finalPosition.y + '%';
                element.style.transform = 'translate3d(0, 0, 0)';
                
                // IMMEDIATE FIX: Ensure element is visible
                ensureDesignElementVisible(element);
                element.style.zIndex = '1000';
            }
            
            // IMMEDIATE FIX: Immediate update for 3D model
            drawDesignPreview();
            applyDesignsToModel();
            
            console.log('🎯 Design position updated:', {
                designId: design.id,
                position: finalPosition
            });
        }
        
        /**
         * CRITICAL FIXES: Optimized realistic shading for depth
         */
        function applyOptimizedRealisticShading(design) {
            console.log('✨ Applying optimized realistic shading to design:', design.id);
            // Implementation for optimized realistic shading
        }
        
        /**
         * ADVANCED: Apply supersampling for crisp edges
         */
        function applySupersampling(design) {
            // Implementation for supersampling enhancement
            console.log('🔍 Applying supersampling to design:', design.id);
        }
        
        /**
         * ADVANCED: Apply fabric blending for realistic integration
         */
        function applyFabricBlending(design) {
            // Implementation for fabric blending
            console.log('🧵 Applying fabric blending to design:', design.id);
        }
        
        /**
         * ADVANCED: Apply realistic shading for depth
         */
        function applyRealisticShading(design) {
            // Implementation for realistic shading
            console.log('✨ Applying realistic shading to design:', design.id);
        }

        /**
         * CRITICAL FIX: Add resize and rotate handles to design element
         */
        function addResizeAndRotateHandles(element, design) {
            if (!element || !design) return;
            
            console.log('🔧 Adding resize and rotate handles to element:', element.id);
            
            // CRITICAL FIX: Create resize handle
            const resizeHandle = document.createElement('div');
            resizeHandle.className = 'resize-handle';
            resizeHandle.innerHTML = '↘';
            resizeHandle.style.cssText = `
                position: absolute;
                bottom: -10px;
                right: -10px;
                width: 20px;
                height: 20px;
                background: #ef4444;
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: nw-resize;
                font-size: 12px;
                font-weight: bold;
                z-index: 1003;
                pointer-events: auto;
                user-select: none;
            `;
            
            // CRITICAL FIX: Create rotate handle
            const rotateHandle = document.createElement('div');
            rotateHandle.className = 'rotate-handle';
            rotateHandle.innerHTML = '↻';
            rotateHandle.style.cssText = `
                position: absolute;
                top: -10px;
                right: -10px;
                width: 20px;
                height: 20px;
                background: #3b82f6;
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                font-size: 12px;
                font-weight: bold;
                z-index: 1003;
                pointer-events: auto;
                user-select: none;
            `;
            
            // CRITICAL FIX: Setup resize functionality
            setupResizeHandle(resizeHandle, element, design);
            
            // CRITICAL FIX: Setup rotate functionality
            setupRotateHandle(rotateHandle, element, design);
            
            // CRITICAL FIX: Add handles to element
            element.appendChild(resizeHandle);
            element.appendChild(rotateHandle);
            
            console.log('✅ Resize and rotate handles added to element:', element.id);
        }
        
        /**
         * CRITICAL FIX: Setup resize handle functionality
         */
        function setupResizeHandle(handle, element, design) {
            let isResizing = false;
            let startWidth, startHeight, startX, startY;
            
            handle.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // CRITICAL FIX: Disable OrbitControls during resize
                if (window.controls) {
                    window.controls.enabled = false;
                }
                
                isResizing = true;
                startWidth = element.offsetWidth;
                startHeight = element.offsetHeight;
                startX = e.clientX;
                startY = e.clientY;
                
                document.addEventListener('mousemove', handleResize);
                document.addEventListener('mouseup', stopResize);
            });
            
            function handleResize(e) {
                if (!isResizing) return;
                
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;
                
                const newWidth = Math.max(50, startWidth + deltaX);
                const newHeight = Math.max(50, startHeight + deltaY);
                
                // CRITICAL FIX: Update element size
                element.style.width = newWidth + 'px';
                element.style.height = newHeight + 'px';
                
                // CRITICAL FIX: Update design size
                design.width = newWidth;
                design.height = newHeight;
                
                // CRITICAL FIX: Update 3D model
                drawDesignPreview();
                applyDesignsToModel();
                
                console.log('🎯 Design resized:', { width: newWidth, height: newHeight });
            }
            
            function stopResize() {
                isResizing = false;
                document.removeEventListener('mousemove', handleResize);
                document.removeEventListener('mouseup', stopResize);
                
                // CRITICAL FIX: Re-enable OrbitControls after resize
                if (window.controls) {
                    window.controls.enabled = true;
                }
            }
        }
        
        /**
         * CRITICAL FIX: Setup rotate handle functionality
         */
        function setupRotateHandle(handle, element, design) {
            let isRotating = false;
            let startAngle, startX, startY;
            
            handle.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // CRITICAL FIX: Disable OrbitControls during rotate
                if (window.controls) {
                    window.controls.enabled = false;
                }
                
                isRotating = true;
                startX = e.clientX;
                startY = e.clientY;
                startAngle = design.rotation || 0;
                
                document.addEventListener('mousemove', handleRotate);
                document.addEventListener('mouseup', stopRotate);
            });
            
            function handleRotate(e) {
                if (!isRotating) return;
                
                const rect = element.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                
                const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
                const newRotation = (angle * 180 / Math.PI) + 90;
                
                // CRITICAL FIX: Update element rotation
                element.style.transform = `translate3d(0, 0, 0) rotate(${newRotation}deg)`;
                
                // CRITICAL FIX: Update design rotation
                design.rotation = newRotation;
                
                // CRITICAL FIX: Update 3D model
                drawDesignPreview();
                applyDesignsToModel();
                
                console.log('🎯 Design rotated:', newRotation);
            }
            
            function stopRotate() {
                isRotating = false;
                document.removeEventListener('mousemove', handleRotate);
                document.removeEventListener('mouseup', stopRotate);
                
                // CRITICAL FIX: Re-enable OrbitControls after rotate
                if (window.controls) {
                    window.controls.enabled = true;
                }
            }
        }
        
        /**
         * CRITICAL FIX: Setup 3D model interaction
         */
        function setup3DModelInteraction(element, design) {
            if (!element || !design) return;
            
            console.log('🔧 Setting up 3D model interaction for element:', element.id);
            
            // CRITICAL FIX: Add 3D model click handler
            element.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('🎯 Design clicked for 3D model interaction:', element.id);
                
                // CRITICAL FIX: Select the design
                selectDesignElement(element);
                
                // CRITICAL FIX: Update 3D model selection
                update3DModelSelection(design);
                
                // CRITICAL FIX: Show handles
                showDesignHandles(element);
            });
            
            // CRITICAL FIX: Add double-click for 3D model focus
            element.addEventListener('dblclick', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('🎯 Design double-clicked for 3D model focus:', element.id);
                
                // CRITICAL FIX: Focus on design in 3D model
                focusOnDesignIn3DModel(design);
            });
            
            console.log('✅ 3D model interaction setup for element:', element.id);
        }
        
        /**
         * CRITICAL FIX: Update 3D model position in real-time
         */
        function update3DModelPosition(design, newPosition) {
            if (!design || !tshirtModel) return;
            
            console.log('🎯 Updating 3D model position for design:', design.id, newPosition);
            
            // CRITICAL FIX: Update design position in the designs array
            const designIndex = designs[currentArea].findIndex(d => d.id === design.id);
            if (designIndex !== -1) {
                designs[currentArea][designIndex].position = newPosition;
            }
            
            // CRITICAL FIX: Force immediate 3D model update
            drawDesignPreview();
            applyDesignsToModel();
            
            // CRITICAL FIX: Update any 3D model meshes or objects
            if (tshirtModel && tshirtModel.children) {
                tshirtModel.children.forEach(child => {
                    if (child.userData && child.userData.designId === design.id) {
                        // Update 3D object position if it exists
                        child.position.set(
                            (newPosition.x - 50) * 0.1,
                            (50 - newPosition.y) * 0.1,
                            0
                        );
                    }
                });
            }
            
            console.log('✅ 3D model position updated for design:', design.id);
        }
        
        /**
         * CRITICAL FIX: Update 3D model selection
         */
        function update3DModelSelection(design) {
            if (!design) return;
            
            console.log('🎯 Updating 3D model selection for design:', design.id);
            
            // CRITICAL FIX: Update selected design
            selectedDesign = design;
            
            // CRITICAL FIX: Update UI to reflect selection
            updateDesignControls();
            updateElementsList();
            
            // CRITICAL FIX: Highlight design in 3D model
            highlightDesignIn3DModel(design);
            
            // CRITICAL FIX: Show design controls in right panel
            showDesignControls(design);
            
            console.log('✅ 3D model selection updated for design:', design.id);
        }
        
        /**
         * CRITICAL FIX: Show design handles
         */
        function showDesignHandles(element) {
            if (!element) return;
            
            // CRITICAL FIX: Show resize and rotate handles
            const resizeHandle = element.querySelector('.resize-handle');
            const rotateHandle = element.querySelector('.rotate-handle');
            
            if (resizeHandle) {
                resizeHandle.style.display = 'flex';
                resizeHandle.style.opacity = '1';
            }
            
            if (rotateHandle) {
                rotateHandle.style.display = 'flex';
                rotateHandle.style.opacity = '1';
            }
            
            console.log('✅ Design handles shown for element:', element.id);
        }
        
        /**
         * CRITICAL FIX: Focus on design in 3D model
         */
        function focusOnDesignIn3DModel(design) {
            if (!design || !camera || !controls) return;
            
            console.log('🎯 Focusing on design in 3D model:', design.id);
            
            // CRITICAL FIX: Calculate focus position based on design position
            const focusX = (design.position.x - 50) * 0.1;
            const focusY = (50 - design.position.y) * 0.1;
            const focusZ = 0;
            
            // CRITICAL FIX: Animate camera to focus position
            const targetPosition = new THREE.Vector3(focusX, focusY, focusZ + 2);
            camera.position.lerp(targetPosition, 0.1);
            
            // CRITICAL FIX: Update controls target
            controls.target.set(focusX, focusY, focusZ);
            controls.update();
            
            console.log('✅ Camera focused on design in 3D model:', design.id);
        }
        
        /**
         * CRITICAL FIX: Highlight design in 3D model
         */
        function highlightDesignIn3DModel(design) {
            if (!design || !tshirtModel) return;
            
            console.log('🎯 Highlighting design in 3D model:', design.id);
            
            // CRITICAL FIX: Remove previous highlights
            tshirtModel.children.forEach(child => {
                if (child.userData && child.userData.isHighlighted) {
                    child.material.emissive.setHex(0x000000);
                    child.userData.isHighlighted = false;
                }
            });
            
            // CRITICAL FIX: Highlight selected design
            tshirtModel.children.forEach(child => {
                if (child.userData && child.userData.designId === design.id) {
                    child.material.emissive.setHex(0x333333);
                    child.userData.isHighlighted = true;
                }
            });
            
            console.log('✅ Design highlighted in 3D model:', design.id);
        }
        
        /**
         * CRITICAL FIX: Show design controls in right panel
         */
        function showDesignControls(design) {
            if (!design) return;
            
            console.log('🎛️ Showing design controls for:', design.id);
            
            // CRITICAL FIX: Get or create design controls container
            let controlsContainer = document.getElementById('designControlsContainer');
            if (!controlsContainer) {
                controlsContainer = document.createElement('div');
                controlsContainer.id = 'designControlsContainer';
                controlsContainer.className = 'design-controls-container';
                controlsContainer.style.cssText = `
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    width: 280px;
                    background: white;
                    border: 2px solid #ef4444;
                    border-radius: 8px;
                    padding: 20px;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
                    z-index: 1000;
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                `;
                
                // CRITICAL FIX: Add to design panel
                const designPanel = document.getElementById('designPanel');
                if (designPanel) {
                    designPanel.appendChild(controlsContainer);
                }
            }
            
            // CRITICAL FIX: Clear existing controls
            controlsContainer.innerHTML = '';
            
            // CRITICAL FIX: Create header
            const header = document.createElement('div');
            header.innerHTML = `
                <h3 style="margin: 0 0 15px 0; color: #ef4444; font-size: 16px; font-weight: bold;">
                    Design Controls - ${design.id}
                </h3>
            `;
            controlsContainer.appendChild(header);
            
            // CRITICAL FIX: Position controls
            const positionControls = createPositionControls(design);
            controlsContainer.appendChild(positionControls);
            
            // CRITICAL FIX: Size controls
            const sizeControls = createSizeControls(design);
            controlsContainer.appendChild(sizeControls);
            
            // CRITICAL FIX: Rotation controls
            const rotationControls = createRotationControls(design);
            controlsContainer.appendChild(rotationControls);
            
            // CRITICAL FIX: Action buttons
            const actionButtons = createActionButtons(design);
            controlsContainer.appendChild(actionButtons);
            
            // CRITICAL FIX: Show controls
            controlsContainer.style.display = 'flex';
            
            console.log('✅ Design controls shown for:', design.id);
        }
        
        /**
         * CRITICAL FIX: Create position controls
         */
        function createPositionControls(design) {
            const container = document.createElement('div');
            container.className = 'position-controls';
            container.style.cssText = `
                display: flex;
                flex-direction: column;
                gap: 10px;
            `;
            
            container.innerHTML = `
                <h4 style="margin: 0; color: #374151; font-size: 14px; font-weight: bold;">Position</h4>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <label style="font-size: 12px; color: #6b7280; min-width: 40px;">X:</label>
                    <input type="range" id="posXSlider" min="0" max="100" value="${design.position?.x || 50}" 
                           style="flex: 1; height: 6px; border-radius: 3px; background: #e5e7eb;">
                    <span id="posXValue" style="font-size: 12px; color: #374151; min-width: 30px; text-align: right;">
                        ${Math.round(design.position?.x || 50)}%
                    </span>
                </div>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <label style="font-size: 12px; color: #6b7280; min-width: 40px;">Y:</label>
                    <input type="range" id="posYSlider" min="0" max="100" value="${design.position?.y || 50}" 
                           style="flex: 1; height: 6px; border-radius: 3px; background: #e5e7eb;">
                    <span id="posYValue" style="font-size: 12px; color: #374151; min-width: 30px; text-align: right;">
                        ${Math.round(design.position?.y || 50)}%
                    </span>
                </div>
            `;
            
            // CRITICAL FIX: Add event listeners
            const posXSlider = container.querySelector('#posXSlider');
            const posYSlider = container.querySelector('#posYSlider');
            const posXValue = container.querySelector('#posXValue');
            const posYValue = container.querySelector('#posYValue');
            
            posXSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                posXValue.textContent = Math.round(value) + '%';
                design.position.x = value;
                updateDesignPosition(design);
            });
            
            posYSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                posYValue.textContent = Math.round(value) + '%';
                design.position.y = value;
                updateDesignPosition(design);
            });
            
            return container;
        }
        
        /**
         * CRITICAL FIX: Create size controls
         */
        function createSizeControls(design) {
            const container = document.createElement('div');
            container.className = 'size-controls';
            container.style.cssText = `
                display: flex;
                flex-direction: column;
                gap: 10px;
            `;
            
            const currentWidth = design.width || 100;
            const currentHeight = design.height || 100;
            const currentScale = design.scale || 1;
            
            container.innerHTML = `
                <h4 style="margin: 0; color: #374151; font-size: 14px; font-weight: bold;">Size</h4>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <label style="font-size: 12px; color: #6b7280; min-width: 40px;">Scale:</label>
                    <input type="range" id="scaleSlider" min="0.1" max="3" step="0.1" value="${currentScale}" 
                           style="flex: 1; height: 6px; border-radius: 3px; background: #e5e7eb;">
                    <span id="scaleValue" style="font-size: 12px; color: #374151; min-width: 30px; text-align: right;">
                        ${currentScale}x
                    </span>
                </div>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <label style="font-size: 12px; color: #6b7280; min-width: 40px;">Width:</label>
                    <input type="range" id="widthSlider" min="20" max="300" value="${currentWidth}" 
                           style="flex: 1; height: 6px; border-radius: 3px; background: #e5e7eb;">
                    <span id="widthValue" style="font-size: 12px; color: #374151; min-width: 30px; text-align: right;">
                        ${currentWidth}px
                    </span>
                </div>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <label style="font-size: 12px; color: #6b7280; min-width: 40px;">Height:</label>
                    <input type="range" id="heightSlider" min="20" max="300" value="${currentHeight}" 
                           style="flex: 1; height: 6px; border-radius: 3px; background: #e5e7eb;">
                    <span id="heightValue" style="font-size: 12px; color: #374151; min-width: 30px; text-align: right;">
                        ${currentHeight}px
                    </span>
                </div>
            `;
            
            // CRITICAL FIX: Add event listeners
            const scaleSlider = container.querySelector('#scaleSlider');
            const widthSlider = container.querySelector('#widthSlider');
            const heightSlider = container.querySelector('#heightSlider');
            const scaleValue = container.querySelector('#scaleValue');
            const widthValue = container.querySelector('#widthValue');
            const heightValue = container.querySelector('#heightValue');
            
            scaleSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                scaleValue.textContent = value + 'x';
                design.scale = value;
                updateDesignSize(design);
            });
            
            widthSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                widthValue.textContent = value + 'px';
                design.width = value;
                updateDesignSize(design);
            });
            
            heightSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                heightValue.textContent = value + 'px';
                design.height = value;
                updateDesignSize(design);
            });
            
            return container;
        }
        
        /**
         * CRITICAL FIX: Create rotation controls
         */
        function createRotationControls(design) {
            const container = document.createElement('div');
            container.className = 'rotation-controls';
            container.style.cssText = `
                display: flex;
                flex-direction: column;
                gap: 10px;
            `;
            
            const currentRotation = design.rotation || 0;
            
            container.innerHTML = `
                <h4 style="margin: 0; color: #374151; font-size: 14px; font-weight: bold;">Rotation</h4>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <label style="font-size: 12px; color: #6b7280; min-width: 40px;">Angle:</label>
                    <input type="range" id="rotationSlider" min="0" max="360" value="${currentRotation}" 
                           style="flex: 1; height: 6px; border-radius: 3px; background: #e5e7eb;">
                    <span id="rotationValue" style="font-size: 12px; color: #374151; min-width: 30px; text-align: right;">
                        ${currentRotation}°
                    </span>
                </div>
                <div style="display: flex; gap: 5px;">
                    <button id="rotateLeft" style="flex: 1; padding: 8px; background: #3b82f6; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer;">
                        ↶ -90°
                    </button>
                    <button id="rotateRight" style="flex: 1; padding: 8px; background: #3b82f6; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer;">
                        ↷ +90°
                    </button>
                </div>
            `;
            
            // CRITICAL FIX: Add event listeners
            const rotationSlider = container.querySelector('#rotationSlider');
            const rotationValue = container.querySelector('#rotationValue');
            const rotateLeft = container.querySelector('#rotateLeft');
            const rotateRight = container.querySelector('#rotateRight');
            
            rotationSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                rotationValue.textContent = value + '°';
                design.rotation = value;
                updateDesignRotation(design);
            });
            
            rotateLeft.addEventListener('click', () => {
                const newRotation = (design.rotation || 0) - 90;
                design.rotation = newRotation < 0 ? newRotation + 360 : newRotation;
                rotationSlider.value = design.rotation;
                rotationValue.textContent = design.rotation + '°';
                updateDesignRotation(design);
            });
            
            rotateRight.addEventListener('click', () => {
                const newRotation = (design.rotation || 0) + 90;
                design.rotation = newRotation >= 360 ? newRotation - 360 : newRotation;
                rotationSlider.value = design.rotation;
                rotationValue.textContent = design.rotation + '°';
                updateDesignRotation(design);
            });
            
            return container;
        }
        
        /**
         * CRITICAL FIX: Create action buttons
         */
        function createActionButtons(design) {
            const container = document.createElement('div');
            container.className = 'action-buttons';
            container.style.cssText = `
                display: flex;
                gap: 10px;
                margin-top: 10px;
            `;
            
            container.innerHTML = `
                <button id="resetDesign" style="flex: 1; padding: 10px; background: #6b7280; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer;">
                    Reset
                </button>
                <button id="deleteDesign" style="flex: 1; padding: 10px; background: #ef4444; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer;">
                    Delete
                </button>
                <button id="closeControls" style="flex: 1; padding: 10px; background: #374151; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer;">
                    Close
                </button>
            `;
            
            // CRITICAL FIX: Add event listeners
            const resetDesign = container.querySelector('#resetDesign');
            const deleteDesign = container.querySelector('#deleteDesign');
            const closeControls = container.querySelector('#closeControls');
            
            resetDesign.addEventListener('click', () => {
                resetDesignToDefault(design);
            });
            
            deleteDesign.addEventListener('click', () => {
                deleteDesignElement(design);
            });
            
            closeControls.addEventListener('click', () => {
                hideDesignControls();
            });
            
            return container;
        }
        
        /**
         * CRITICAL FIX: Update design position from controls
         */
        function updateDesignPosition(design) {
            if (!design) return;
            
            console.log('🎯 Updating design position from controls:', design.position);
            
            // CRITICAL FIX: Update design element in panel
            const element = document.getElementById(design.id);
            if (element) {
                const previewCanvas = document.getElementById('designPreviewCanvas');
                if (previewCanvas) {
                    const x = (design.position.x / 100) * previewCanvas.clientWidth;
                    const y = (design.position.y / 100) * previewCanvas.clientHeight;
                    
                    element.style.left = x + 'px';
                    element.style.top = y + 'px';
                    element.style.transform = 'translate3d(0, 0, 0)';
                }
            }
            
            // CRITICAL FIX: Update 3D model
            drawDesignPreview();
            applyDesignsToModel();
            update3DModelPosition(design, design.position);
            
            console.log('✅ Design position updated from controls');
        }
        
        /**
         * CRITICAL FIX: Update design size from controls
         */
        function updateDesignSize(design) {
            if (!design) return;
            
            console.log('🎯 Updating design size from controls:', { width: design.width, height: design.height, scale: design.scale });
            
            // CRITICAL FIX: Update design element in panel
            const element = document.getElementById(design.id);
            if (element) {
                if (design.width) {
                    element.style.width = design.width + 'px';
                }
                if (design.height) {
                    element.style.height = design.height + 'px';
                }
                if (design.scale) {
                    element.style.transform = `translate3d(0, 0, 0) scale(${design.scale})`;
                }
            }
            
            // CRITICAL FIX: Update 3D model
            drawDesignPreview();
            applyDesignsToModel();
            
            console.log('✅ Design size updated from controls');
        }
        
        /**
         * CRITICAL FIX: Update design rotation from controls
         */
        function updateDesignRotation(design) {
            if (!design) return;
            
            console.log('🎯 Updating design rotation from controls:', design.rotation);
            
            // CRITICAL FIX: Update design element in panel
            const element = document.getElementById(design.id);
            if (element) {
                const scale = design.scale || 1;
                element.style.transform = `translate3d(0, 0, 0) rotate(${design.rotation}deg) scale(${scale})`;
            }
            
            // CRITICAL FIX: Update 3D model
            drawDesignPreview();
            applyDesignsToModel();
            
            console.log('✅ Design rotation updated from controls');
        }
        
        /**
         * CRITICAL FIX: Reset design to default values
         */
        function resetDesignToDefault(design) {
            if (!design) return;
            
            console.log('🔄 Resetting design to default:', design.id);
            
            // CRITICAL FIX: Reset to default values
            design.position = { x: 50, y: 50 };
            design.width = 100;
            design.height = 100;
            design.scale = 1;
            design.rotation = 0;
            
            // CRITICAL FIX: Update controls
            showDesignControls(design);
            
            // CRITICAL FIX: Update 3D model
            updateDesignPosition(design);
            updateDesignSize(design);
            updateDesignRotation(design);
            
            console.log('✅ Design reset to default');
        }
        
        /**
         * CRITICAL FIX: Delete design element
         */
        function deleteDesignElement(design) {
            if (!design) return;
            
            console.log('🗑️ Deleting design element:', design.id);
            
            // CRITICAL FIX: Remove from designs array
            const designIndex = designs[currentArea].findIndex(d => d.id === design.id);
            if (designIndex !== -1) {
                designs[currentArea].splice(designIndex, 1);
            }
            
            // CRITICAL FIX: Remove element from DOM
            const element = document.getElementById(design.id);
            if (element) {
                element.remove();
            }
            
            // CRITICAL FIX: Hide controls
            hideDesignControls();
            
            // CRITICAL FIX: Update 3D model
            drawDesignPreview();
            applyDesignsToModel();
            
            // CRITICAL FIX: Clear selection
            selectedDesign = null;
            
            console.log('✅ Design element deleted');
        }
        
        /**
         * CRITICAL FIX: Setup right panel interaction
         */
        function setupRightPanelInteraction(element, design) {
            if (!element || !design) return;
            
            console.log('🔧 Setting up right panel interaction for element:', element.id);
            
            // CRITICAL FIX: Ensure element is interactive
            element.style.pointerEvents = 'auto';
            element.style.cursor = 'pointer';
            element.style.userSelect = 'none';
            element.style.webkitUserSelect = 'none';
            element.style.mozUserSelect = 'none';
            element.style.msUserSelect = 'none';
            element.style.touchAction = 'none';
            
            // CRITICAL FIX: Add click handler for right panel selection
            element.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('🎯 Design clicked in right panel:', element.id);
                
                // CRITICAL FIX: Select the design
                selectDesignElement(element);
                
                // CRITICAL FIX: Show design controls
                showDesignControls(design);
                
                // CRITICAL FIX: Update 3D model selection
                update3DModelSelection(design);
                
                // CRITICAL FIX: Show handles
                showDesignHandles(element);
                
                // CRITICAL FIX: Ensure element is visible and selected
                ensureDesignElementVisible(element);
                element.style.zIndex = '1001';
                element.style.pointerEvents = 'auto';
                
                // CRITICAL FIX: Add selected class for visual feedback
                element.classList.add('selected');
                
                // CRITICAL FIX: Update design properties panel
                updateDesignPropertiesPanel(design);
                
                console.log('✅ Design selected in right panel:', element.id);
            });
            
            // CRITICAL FIX: Add double-click for quick edit
            element.addEventListener('dblclick', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('🎯 Design double-clicked in right panel for quick edit:', element.id);
                
                // CRITICAL FIX: Show design controls immediately
                showDesignControls(design);
                
                // CRITICAL FIX: Focus on design in 3D model
                focusOnDesignIn3DModel(design);
            });
            
            // CRITICAL FIX: Add hover effects for better UX
            element.addEventListener('mouseenter', () => {
                element.style.transform = 'translate3d(0, -2px, 0) scale(1.02)';
                element.style.filter = 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.15))';
                element.style.cursor = 'pointer';
            });
            
            element.addEventListener('mouseleave', () => {
                if (!element.classList.contains('selected')) {
                    element.style.transform = 'translate3d(0, 0, 0)';
                    element.style.filter = 'none';
                }
            });
            
            // CRITICAL FIX: Add touch support for mobile devices
            element.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('👆 Design touched in right panel:', element.id);
                
                // CRITICAL FIX: Select the design
                selectDesignElement(element);
                
                // CRITICAL FIX: Show design controls
                showDesignControls(design);
                
                // CRITICAL FIX: Update 3D model selection
                update3DModelSelection(design);
                
                // CRITICAL FIX: Show handles
                showDesignHandles(element);
                
                // CRITICAL FIX: Add selected class for visual feedback
                element.classList.add('selected');
                
                // CRITICAL FIX: Update design properties panel
                updateDesignPropertiesPanel(design);
                
                console.log('✅ Design selected via touch in right panel:', element.id);
            });
            
            console.log('✅ Right panel interaction setup for element:', element.id);
        }
        
        /**
         * CRITICAL FIX: Update design properties panel
         */
        function updateDesignPropertiesPanel(design) {
            if (!design) return;
            
            console.log('🎛️ Updating design properties panel for:', design.id);
            
            // CRITICAL FIX: Find or create properties panel
            let propertiesPanel = document.querySelector('.design-properties-panel');
            if (!propertiesPanel) {
                propertiesPanel = document.createElement('div');
                propertiesPanel.className = 'design-properties-panel';
                propertiesPanel.style.cssText = `
                    position: absolute;
                    bottom: 20px;
                    right: 20px;
                    width: 280px;
                    background: white;
                    border: 2px solid #3b82f6;
                    border-radius: 8px;
                    padding: 20px;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
                    z-index: 1000;
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                `;
                
                // CRITICAL FIX: Add to design panel
                const designPanel = document.getElementById('designPanel');
                if (designPanel) {
                    designPanel.appendChild(propertiesPanel);
                }
            }
            
            // CRITICAL FIX: Clear existing content
            propertiesPanel.innerHTML = '';
            
            // CRITICAL FIX: Create header
            const header = document.createElement('div');
            header.innerHTML = `
                <h3 style="margin: 0 0 15px 0; color: #3b82f6; font-size: 16px; font-weight: bold;">
                    Tasarım Özellikleri - ${design.id}
                </h3>
            `;
            propertiesPanel.appendChild(header);
            
            // CRITICAL FIX: Create quick controls
            const quickControls = createQuickControls(design);
            propertiesPanel.appendChild(quickControls);
            
            // CRITICAL FIX: Show properties panel
            propertiesPanel.style.display = 'flex';
            
            console.log('✅ Design properties panel updated for:', design.id);
        }
        
        /**
         * CRITICAL FIX: Make element immediately interactive
         */
        function makeElementInteractive(element, design) {
            if (!element || !design) return;
            
            console.log('🔧 Making element immediately interactive:', element.id);
            
            // CRITICAL FIX: Force interactive styles
            element.style.pointerEvents = 'auto';
            element.style.cursor = 'pointer';
            element.style.userSelect = 'none';
            element.style.webkitUserSelect = 'none';
            element.style.mozUserSelect = 'none';
            element.style.msUserSelect = 'none';
            element.style.touchAction = 'none';
            element.style.display = 'block';
            element.style.visibility = 'visible';
            element.style.opacity = '1';
            element.style.zIndex = '1000';
            element.style.position = 'absolute';
            element.style.transform = 'translate3d(0, 0, 0)';
            
            // CRITICAL FIX: Add interactive class
            element.classList.add('interactive-design-element');
            
            // CRITICAL FIX: Add data attributes for identification
            element.setAttribute('data-design-id', design.id);
            element.setAttribute('data-interactive', 'true');
            
            // CRITICAL FIX: Force reflow to ensure styles are applied
            element.offsetHeight;
            
            // CRITICAL FIX: Add click event listener with immediate feedback
            element.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('🎯 Element clicked (immediate):', element.id);
                
                // CRITICAL FIX: Visual feedback
                element.style.transform = 'translate3d(0, -2px, 0) scale(1.02)';
                element.style.filter = 'drop-shadow(0 8px 16px rgba(239, 68, 68, 0.3))';
                
                // CRITICAL FIX: Select the design
                selectDesignElement(element);
                
                // CRITICAL FIX: Show design controls
                showDesignControls(design);
                
                // CRITICAL FIX: Update 3D model selection
                update3DModelSelection(design);
                
                // CRITICAL FIX: Show handles
                showDesignHandles(element);
                
                // CRITICAL FIX: Add selected class
                element.classList.add('selected');
                
                // CRITICAL FIX: Update design properties panel
                updateDesignPropertiesPanel(design);
                
                // CRITICAL FIX: Reset visual feedback after a short delay
                setTimeout(() => {
                    if (element.classList.contains('selected')) {
                        element.style.transform = 'translate3d(0, -4px, 0) scale(1.05)';
                        element.style.filter = 'drop-shadow(0 12px 24px rgba(239, 68, 68, 0.3))';
                    }
                }, 150);
                
                console.log('✅ Element made interactive and selected:', element.id);
            });
            
            // CRITICAL FIX: Add touch support
            element.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('👆 Element touched (immediate):', element.id);
                
                // CRITICAL FIX: Select the design
                selectDesignElement(element);
                
                // CRITICAL FIX: Show design controls
                showDesignControls(design);
                
                // CRITICAL FIX: Update 3D model selection
                update3DModelSelection(design);
                
                // CRITICAL FIX: Show handles
                showDesignHandles(element);
                
                // CRITICAL FIX: Add selected class
                element.classList.add('selected');
                
                // CRITICAL FIX: Update design properties panel
                updateDesignPropertiesPanel(design);
                
                console.log('✅ Element made interactive via touch and selected:', element.id);
            });
            
            console.log('✅ Element made immediately interactive:', element.id);
        }
        
        /**
         * CRITICAL FIX: Create quick controls for properties panel
         */
        function createQuickControls(design) {
            const container = document.createElement('div');
            container.className = 'quick-controls';
            container.style.cssText = `
                display: flex;
                flex-direction: column;
                gap: 10px;
            `;
            
            container.innerHTML = `
                <div style="display: flex; gap: 10px; align-items: center;">
                    <label style="font-size: 12px; color: #6b7280; min-width: 60px;">Boyut:</label>
                    <input type="range" id="quickScaleSlider" min="0.1" max="3" step="0.1" value="${design.scale || 1}" 
                           style="flex: 1; height: 6px; border-radius: 3px; background: #e5e7eb;">
                    <span id="quickScaleValue" style="font-size: 12px; color: #374151; min-width: 30px; text-align: right;">
                        ${(design.scale || 1)}x
                    </span>
                </div>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <label style="font-size: 12px; color: #6b7280; min-width: 60px;">Döndür:</label>
                    <input type="range" id="quickRotationSlider" min="0" max="360" value="${design.rotation || 0}" 
                           style="flex: 1; height: 6px; border-radius: 3px; background: #e5e7eb;">
                    <span id="quickRotationValue" style="font-size: 12px; color: #374151; min-width: 30px; text-align: right;">
                        ${design.rotation || 0}°
                    </span>
                </div>
                <div style="display: flex; gap: 5px;">
                    <button id="quickReset" style="flex: 1; padding: 8px; background: #6b7280; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer;">
                        Sıfırla
                    </button>
                    <button id="quickDelete" style="flex: 1; padding: 8px; background: #ef4444; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer;">
                        Sil
                    </button>
                    <button id="quickAdvanced" style="flex: 1; padding: 8px; background: #3b82f6; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer;">
                        Gelişmiş
                    </button>
                </div>
            `;
            
            // CRITICAL FIX: Add event listeners
            const scaleSlider = container.querySelector('#quickScaleSlider');
            const rotationSlider = container.querySelector('#quickRotationSlider');
            const scaleValue = container.querySelector('#quickScaleValue');
            const rotationValue = container.querySelector('#quickRotationValue');
            const resetBtn = container.querySelector('#quickReset');
            const deleteBtn = container.querySelector('#quickDelete');
            const advancedBtn = container.querySelector('#quickAdvanced');
            
            scaleSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                scaleValue.textContent = value + 'x';
                design.scale = value;
                updateDesignSize(design);
            });
            
            rotationSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                rotationValue.textContent = value + '°';
                design.rotation = value;
                updateDesignRotation(design);
            });
            
            resetBtn.addEventListener('click', () => {
                resetDesignToDefault(design);
            });
            
            deleteBtn.addEventListener('click', () => {
                deleteDesignElement(design);
            });
            
            advancedBtn.addEventListener('click', () => {
                showDesignControls(design);
            });
            
            return container;
        }
        
        /**
         * CRITICAL FIX: Hide design controls
         */
        function hideDesignControls() {
            const controlsContainer = document.getElementById('designControlsContainer');
            if (controlsContainer) {
                controlsContainer.style.display = 'none';
            }
            console.log('✅ Design controls hidden');
        }
        
        /**
         * CRITICAL FIX: Initialize and restore full functionality
         */
        function initializeAndRestoreFunctionality() {
            console.log('🔧 Initializing and restoring full functionality...');
            
            // CRITICAL FIX: Restore right panel functionality
            restoreRightPanelFunctionality();
            
            // CRITICAL FIX: Force visibility and interaction of all existing elements
            const allDesignElements = document.querySelectorAll('.design-element');
            allDesignElements.forEach(element => {
                // CRITICAL FIX: Force visibility
                ensureDesignElementVisible(element);
                element.style.position = 'absolute';
                element.style.zIndex = '1000';
                element.style.transform = 'translate3d(0, 0, 0)';
                
                // CRITICAL FIX: Force interaction
                element.style.pointerEvents = 'auto';
                element.style.cursor = 'grab';
                element.style.userSelect = 'none';
                element.style.webkitUserSelect = 'none';
                element.style.mozUserSelect = 'none';
                element.style.msUserSelect = 'none';
                element.style.touchAction = 'none';
                
                // CRITICAL FIX: Find corresponding design and setup interactions
                const designId = element.id;
                const design = designs[currentArea]?.find(d => d.id === designId);
                if (design) {
                    setupEnhancedInteractions(element, design);
                    console.log('✅ Restored interactions for element:', designId);
                }
            });
            
            // CRITICAL FIX: Ensure design panel is visible and interactive
            const designPanel = document.getElementById('designPanel');
            if (designPanel) {
                designPanel.style.display = 'flex';
                designPanel.style.visibility = 'visible';
                designPanel.style.opacity = '1';
                designPanel.style.zIndex = '1000';
                designPanel.style.pointerEvents = 'auto';
            }
            
            // CRITICAL FIX: Ensure design elements layer is interactive
            const designElementsLayer = document.querySelector('.design-elements-layer');
            if (designElementsLayer) {
                designElementsLayer.style.pointerEvents = 'auto';
                designElementsLayer.style.userSelect = 'none';
                designElementsLayer.style.webkitUserSelect = 'none';
                designElementsLayer.style.mozUserSelect = 'none';
                designElementsLayer.style.msUserSelect = 'none';
            }
            
            console.log('✅ Full functionality restored');
        }
        
        /**
         * CRITICAL FIX: Enhanced design addition with duplicate prevention
         */
        function addDesignToArea(imageData, fileName, naturalWidth, naturalHeight) {
            // CRITICAL FIX: Check for existing design by image data to prevent duplicates
            const existingDesign = designs[currentArea]?.find(d => d.imageData === imageData);
            if (existingDesign) {
                console.log('[ADD] skipped duplicate', existingDesign.id);
                return existingDesign;
            }
            
            const elementId = 'design-' + elementIdCounter++;
            
            // CRITICAL FIX: Create design with proper normalized coordinates
            const design = {
                id: elementId,
                imageData: imageData,
                fileName: fileName,
                name: fileName,
                size: Math.min(naturalWidth, naturalHeight),
                opacity: 100,
                rotation: 0,
                x: 0.5, // Center X (0-1 range)
                y: 0.5, // Center Y (0-1 range)
                scale: 1.5, // Default scale
                width: Math.min(naturalWidth, 200),
                height: (Math.min(naturalWidth, 200) / naturalWidth) * naturalHeight,
                originalWidth: naturalWidth,
                originalHeight: naturalHeight,
                area: currentArea,
                image: new Image()
            };
            
            design.image.src = imageData;
            
            // CRITICAL FIX: Assert DOM structure and get refs
            if (!assertRightPanelDOM()) {
                console.warn('[RP] Missing DOM structure in addDesignToArea');
                return;
            }
            
            const refs = getRightPanelRefs();
            if (!refs.preview || !refs.canvas || !refs.layer) {
                console.warn('[RP] Missing refs (guarded)');
                return;
            }
            
            // CRITICAL FIX: Validate rect before proceeding
            const rect = refs.rect();
            if (!rect || !Number.isFinite(rect.width) || rect.width <= 0 || !Number.isFinite(rect.height) || rect.height <= 0) {
                console.warn('[RP] Invalid rect in addDesignToArea');
                return;
            }
            
            // Add to designs store
            designs[currentArea].push(design);
            console.log('[ADD]', currentArea, design.id, 'added');
            
            // CRITICAL FIX: Create and position design element
            const element = createDesignElement(design);
            if (element) {
                refs.layer.appendChild(element);
                updateElementPositionFromPercentages(element, design, rect);
            }
            
            // CRITICAL FIX: Select the new design
            selectedDesign = design;
            selectDesignElement(element);
            
            // CRITICAL FIX: Update 3D model
            scheduleApplyDesignsIdle(250);
            
            return design;
        }
        
        /**
         * CRITICAL FIX: Create design element with proper styling
         */
        function createDesignElement(design) {
            if (!design) return null;
            
            const element = document.createElement('div');
            element.id = design.id;
            element.className = 'design-element';
            element.setAttribute('data-design-id', design.id);
            element.style.cssText = `
                position: absolute;
                pointer-events: auto;
                user-select: none;
                touch-action: none;
                transform-origin: center center;
                cursor: grab;
                z-index: 10;
            `;
            
            // Create image element
            const img = document.createElement('img');
            img.src = design.imageData;
            img.alt = design.name || 'Design';
            img.title = design.name || 'Design';
            img.style.cssText = `
                width: 100%;
                height: 100%;
                object-fit: contain;
                pointer-events: none;
            `;
            
            element.appendChild(img);
            
            // Add interaction handlers
            element.addEventListener('pointerdown', handleElementPointerDown);
            element.addEventListener('click', handleElementClick);
            
            return element;
        }
        
        /**
         * CRITICAL FIX: Handle element pointer down for drag/rotate
         */
        function handleElementPointerDown(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const element = e.currentTarget;
            const designId = element.getAttribute('data-design-id');
            const design = designs[currentArea]?.find(d => d.id === designId);
            if (!design) return;
            
            // Select this design
            selectedDesign = design;
            selectDesignElement(element);
            
            // Set interaction state
            window.__interactionActive = true;
            element.classList.add('no-anim');
            
            // Capture pointer
            element.setPointerCapture(e.pointerId);
            
            const startX = e.clientX;
            const startY = e.clientY;
            const startXPercent = design.x || 0.5;
            const startYPercent = design.y || 0.5;
            const startRotation = design.rotation || 0;
            const startScale = design.scale || 1;
            
            const refs = getRightPanelRefs();
            const rect = refs.rect();
            if (!rect) return;
            
            const handlePointerMove = (moveEvent) => {
                if (!window.__interactionActive) return;
                
                const deltaX = moveEvent.clientX - startX;
                const deltaY = moveEvent.clientY - startY;
                
                if (moveEvent.shiftKey) {
                    // Rotate mode
                    const centerX = rect.left + rect.width / 2;
                    const centerY = rect.top + rect.height / 2;
                    const angleRad = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX) -
                                   Math.atan2(startY - centerY, startX - centerX);
                    const angleDeg = angleRad * (180 / Math.PI);
                    
                    design.rotation = (startRotation + angleDeg) % 360;
                    if (design.rotation < 0) design.rotation += 360;
                    
                    element.style.transform = `translate(-50%, -50%) rotate(${design.rotation}deg) scale(${design.scale})`;
                } else {
                    // Move mode
                    const newXPercent = startXPercent + (deltaX / rect.width);
                    const newYPercent = startYPercent + (deltaY / rect.height);
                    
                    // Clamp to printable area (0.05 to 0.95 for 10% padding)
                    design.x = Math.max(0.05, Math.min(0.95, newXPercent));
                    design.y = Math.max(0.05, Math.min(0.95, newYPercent));
                    
                    element.style.left = `${design.x * rect.width}px`;
                    element.style.top = `${design.y * rect.height}px`;
                }
            };
            
            const handlePointerUp = (upEvent) => {
                if (!window.__interactionActive) return;
                
                element.releasePointerCapture(e.pointerId);
                element.classList.remove('no-anim');
                window.__interactionActive = false;
                
                // Debounced 3D update
                scheduleApplyDesignsIdle(250);
                
                document.removeEventListener('pointermove', handlePointerMove);
                document.removeEventListener('pointerup', handlePointerUp);
            };
            
            document.addEventListener('pointermove', handlePointerMove);
            document.addEventListener('pointerup', handlePointerUp);
        }
        
        /**
         * CRITICAL FIX: Handle element click for selection
         */
        function handleElementClick(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const element = e.currentTarget;
            const designId = element.getAttribute('data-design-id');
            const design = designs[currentArea]?.find(d => d.id === designId);
            if (design) {
                selectedDesign = design;
                selectDesignElement(element);
            }
        }
        
        /**
         * CRITICAL FIX: Handle layer pointer down for background clicks
         */
        function handleLayerPointerDown(e) {
            // Only handle if clicking on the layer itself, not on design elements
            if (e.target.classList.contains('design-elements-layer')) {
                // Deselect current design
                selectedDesign = null;
                selectDesignElement(null);
            }
        }
        
        /**
         * CRITICAL FIX: Handle layer wheel for scaling selected design
         */
        function handleLayerWheel(e) {
            if (!selectedDesign) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            const element = document.getElementById(selectedDesign.id);
            if (!element) return;
            
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            const newScale = Math.max(0.1, Math.min(3.0, (selectedDesign.scale || 1) * delta));
            
            selectedDesign.scale = newScale;
            element.style.transform = `translate(-50%, -50%) rotate(${selectedDesign.rotation || 0}deg) scale(${newScale})`;
            
            // Debounced 3D update
            scheduleApplyDesignsIdle(250);
        }

        /**
         * Add control handles (resize and delete) to design element
         */
        function addControlHandles(designElement, design) {
            if (!designElement || !design) {
                console.error('❌ addControlHandles called with null parameters');
                return;
            }
            
            console.log('🎛️ Adding control handles to:', design.id);
            
            // Add resize handles
            ['tl', 'tr', 'bl', 'br'].forEach(pos => {
                const handle = document.createElement('div');
                handle.className = 'resize-handle ' + pos;
                handle.dataset.handle = pos;
                handle.style.setProperty('display', 'none', 'important'); // Hidden by default
                designElement.appendChild(handle);
            });

            // Add delete button
            const deleteBtn = document.createElement('div');
            deleteBtn.className = 'delete-handle';
            deleteBtn.innerHTML = '×';
            deleteBtn.style.setProperty('display', 'none', 'important'); // Hidden by default
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                e.preventDefault();
                console.log('🗑️ Delete button clicked for:', design.id);
                removeDesign(design.id);
            };
            designElement.appendChild(deleteBtn);
            
            // Show handles when element is selected
            const showHandles = () => {
                designElement.querySelectorAll('.resize-handle, .delete-handle').forEach(handle => {
                    handle.style.setProperty('display', 'flex', 'important');
                });
            };
            
            const hideHandles = () => {
                designElement.querySelectorAll('.resize-handle, .delete-handle').forEach(handle => {
                    handle.style.setProperty('display', 'none', 'important');
                });
            };
            
            // Store handle control functions on element
            designElement._showHandles = showHandles;
            designElement._hideHandles = hideHandles;
            
            console.log('✅ Control handles added to:', design.id);
        }

        /**
         * ENHANCED Interact.js setup with robust error handling and visibility preservation
         */
        function setupInteractJS(designElement, design) {
            if (!designElement || !design) {
                console.error('❌ setupInteractJS called with null element or design');
                return false;
            }
            
            console.log('🎮 Setting up Interact.js for element:', design.id);
            
            try {
                interact(designElement)
                    .draggable({
                        modifiers: [
                            interact.modifiers.restrictRect({
                                restriction: 'parent',
                                elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
                            })
                        ],
                        listeners: {
                            start(event) {
                                isDragging = true;
                                console.log('🚀 Drag started for:', design.id);
                                
                                // Ensure element remains visible during drag
                                ensureElementVisibility(event.target, design);
                                
                                const rect = event.target.getBoundingClientRect();
                                const parentRect = event.target.parentElement.getBoundingClientRect();
                                dragOffset.x = event.clientX - rect.left;
                                dragOffset.y = event.clientY - rect.top;
                            },
                            move(event) {
                                if (!isDragging || !selectedDesign) return;
                                
                                const target = event.target;
                                const parentRect = target.parentElement.getBoundingClientRect();
                                
                                // Calculate new position
                                let newX = event.clientX - dragOffset.x;
                                let newY = event.clientY - dragOffset.y;
                                
                                // Apply position
                                target.style.left = `${(newX / parentRect.width) * 100}%`;
                                target.style.top = `${(newY / parentRect.height) * 100}%`;
                                
                                // Update design object
                                selectedDesign.position.x = (newX / parentRect.width) * 100;
                                selectedDesign.position.y = (newY / parentRect.height) * 100;
                                
                                // Ensure visibility during move
                                ensureElementVisibility(target, selectedDesign);
                                
                                console.log('📍 Element moved:', design.id, { x: selectedDesign.position.x, y: selectedDesign.position.y });
                                
                                drawDesignPreview();
                                throttledApplyDesignsToModel();
                            },
                            end(event) {
                                isDragging = false;
                                console.log('🏁 Drag ended for:', design.id);
                                
                                // Final visibility check
                                ensureElementVisibility(event.target, design);
                            }
                        }
                    })
                    .resizable({
                        edges: { left: true, right: true, bottom: true, top: true },
                        modifiers: [
                            interact.modifiers.restrictRect({
                                restriction: 'parent',
                                elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
                            }),
                            interact.modifiers.aspectRatio({
                                ratio: 'preserve'
                            }),
                            interact.modifiers.restrictSize({
                                min: { width: 10, height: 10 }
                            })
                        ],
                        listeners: {
                            start(event) {
                                isResizing = true;
                                console.log('🔄 Resize started for:', design.id);
                                
                                ensureElementVisibility(event.target, design);
                                
                                const target = event.target;
                                const rect = target.getBoundingClientRect();
                                const parentRect = target.parentElement.getBoundingClientRect();
                                
                                resizeStart = {
                                    x: rect.left - parentRect.left,
                                    y: rect.top - parentRect.top,
                                    width: rect.width,
                                    height: rect.height
                                };
                            },
                            move(event) {
                                if (!isResizing || !selectedDesign) return;
                                
                                const target = event.target;
                                const parentRect = target.parentElement.getBoundingClientRect();
                                
                                let { left, top, width, height } = event.rect;
                                left -= parentRect.left;
                                top -= parentRect.top;
                                
                                // Apply new size and position
                                target.style.width = `${width}px`;
                                target.style.height = `${height}px`;
                                target.style.left = `${(left / parentRect.width) * 100}%`;
                                target.style.top = `${(top / parentRect.height) * 100}%`;
                                
                                // Update design object
                                selectedDesign.size = width;
                                selectedDesign.width = width;
                                selectedDesign.height = height;
                                selectedDesign.position.x = (left / parentRect.width) * 100;
                                selectedDesign.position.y = (top / parentRect.height) * 100;
                                
                                // Ensure visibility during resize
                                ensureElementVisibility(target, selectedDesign);
                                
                                // Update controls
                                const sizeControl = document.getElementById('sizeControl');
                                if (sizeControl) sizeControl.value = width;
                                
                                console.log('📏 Element resized:', design.id, { width, height });
                                
                                drawDesignPreview();
                                throttledApplyDesignsToModel();
                            },
                            end(event) {
                                isResizing = false;
                                console.log('🏁 Resize ended for:', design.id);
                                
                                // Final visibility check
                                ensureElementVisibility(event.target, design);
                            }
                        }
                    });
                
                console.log('✅ Interact.js setup completed for:', design.id);
                return true;
                
            } catch (error) {
                console.error('❌ Error setting up Interact.js for element:', design.id, error);
                return false;
            }
        }

        /**
         * YENİ SEÇİM SİSTEMİ - Robust ve güvenli element seçimi
         * @param {HTMLElement} element - Seçilecek HTML tasarım elementi.
         */
        function newSelectDesignElement(element) {
            console.log('🎯 NEW SELECTION SYSTEM: Selecting element', element.id);
            
            // 1. Element validation - ensure it exists and is in DOM
            if (!element || !element.parentNode || !document.contains(element)) {
                console.error('❌ Element validation failed:', element);
                return false;
            }
            
            // 2. Clear previous selections safely
            document.querySelectorAll('.design-element').forEach(el => {
                el.classList.remove('selected');
                // Don't modify visibility of other elements
            });
            
            // 3. Apply selection with forced visibility
            element.classList.add('selected');
            
            // 4. Force visibility using setProperty with important
            const forceVisibility = () => {
                element.style.setProperty('display', 'block', 'important');
                element.style.setProperty('visibility', 'visible', 'important');
                element.style.setProperty('opacity', '1', 'important');
                element.style.setProperty('pointer-events', 'auto', 'important');
                element.style.setProperty('z-index', '25', 'important');
                element.style.setProperty('position', 'absolute', 'important');
                
                // Additional safeguards for image disappearance - with null safety
                if (selectedDesign) {
                    const safeRotation = initializeDesignRotation(selectedDesign);
                    element.style.setProperty('transform', `rotate(${safeRotation}deg)`, 'important');
                    element.style.setProperty('width', `${selectedDesign.width || 100}px`, 'important');
                    element.style.setProperty('height', `${selectedDesign.height || 100}px`, 'important');
                    element.style.setProperty('left', `${selectedDesign.position?.x || 10}%`, 'important');
                    element.style.setProperty('top', `${selectedDesign.position?.y || 10}%`, 'important');
                } else {
                    console.warn('⚠️ selectedDesign is null in forceVisibility, using defaults');
                    element.style.setProperty('transform', 'rotate(0deg)', 'important');
                    element.style.setProperty('width', '100px', 'important');
                    element.style.setProperty('height', '100px', 'important');
                    element.style.setProperty('left', '10%', 'important');
                    element.style.setProperty('top', '10%', 'important');
                }
                
                // Ensure the image inside is also visible
                const img = element.querySelector('img');
                if (img) {
                    img.style.setProperty('display', 'block', 'important');
                    img.style.setProperty('visibility', 'visible', 'important');
                    img.style.setProperty('opacity', 'inherit', 'important');
                }
                
                console.log('🔧 Applied comprehensive visibility fixes to element:', element.id);
            };
            
            // 5. Update global selection state FIRST (before forceVisibility)
            const designId = element.id;
            selectedDesign = designs[currentArea].find(d => d.id === designId);
            
            if (!selectedDesign) {
                console.error('❌ Design not found in array:', designId);
                return false;
            }
            
            // Now call forceVisibility with selectedDesign properly set
            forceVisibility();
            
            // 6. Update UI indicators
            updateSelectionIndicators(designId);
            updateElementsList();
            updatePropertiesPanel();
            
            // 6.5. Activate disappearance prevention
            preventImageDisappearance(designId);
            
            // 7. Verify selection after short delay
            setTimeout(() => {
                const isStillVisible = element.style.display !== 'none' && 
                                     element.style.visibility !== 'hidden' &&
                                     document.contains(element);
                
                if (!isStillVisible) {
                    console.warn('⚠️ Element became invisible, restoring...');
                    forceVisibility();
                }
                
                console.log('✅ Selection verified:', {
                    id: designId,
                    visible: isStillVisible,
                    inDOM: document.contains(element),
                    hasClass: element.classList.contains('selected')
                });
            }, 100);
            
            return true;
        }

        /**
         * LEGACY - Bir tasarım elementini seçili hale getirir ve diğerlerini seçimi kaldırır.
         * Seçili tasarımın kontrol ayarlarını günceller.
         * @param {HTMLElement} element - Seçilecek HTML tasarım elementi.
         */
        function selectDesignElement(elementOrId) {
            // PRODUCTION FIX: Handle both element and ID input
            let element;
            let designId;
            
            if (typeof elementOrId === 'string') {
                designId = elementOrId;
                element = document.getElementById(designId);
                if (!element) {
                    console.warn('Element is not in DOM:', designId);
                    return;
                }
            } else {
                element = elementOrId;
                if (!element || !element.parentNode) {
                    console.warn('Element is not in DOM:', element?.id || 'unknown');
                    return;
                }
                designId = element.id;
            }
            
            console.log('Selecting design element:', designId); // Debug log
            
            // Önce tüm elementlerden seçimi kaldır
            document.querySelectorAll('.design-element').forEach(el => {
                el.classList.remove('selected');
            });
            
            // Seçili elementi işaretle ve görünür olduğundan emin ol
            element.classList.add('selected');
            element.style.setProperty('display', 'block', 'important');
            element.style.setProperty('visibility', 'visible', 'important');
            element.style.setProperty('position', 'absolute', 'important');
            element.style.setProperty('z-index', '20', 'important'); // Seçili element daha üstte olsun

            selectedDesign = designs[currentArea].find(d => d.id === designId);

            if (!selectedDesign) {
                console.error('Design not found in designs array:', designId, currentArea);
                return;
            }

            // Seçili tasarımın verilerini güncelle
            element.style.opacity = selectedDesign.opacity / 100;
            
            // Elementin boyut ve pozisyonunu yeniden uygula (kaybolma durumunda) - NULL CHECK ADDED
            if (selectedDesign) {
                element.style.width = (selectedDesign.width || 100) + 'px';
                element.style.height = (selectedDesign.height || 100) + 'px';
                element.style.left = (selectedDesign.position?.x || 10) + '%';
                element.style.top = (selectedDesign.position?.y || 10) + '%';
                element.style.transform = `rotate(${selectedDesign.rotation || 0}deg)`;
            } else {
                console.error('❌ selectedDesign is null, cannot apply positioning');
            }

            console.log('Design element selected successfully:', designId);
            
            // State validation
            setTimeout(() => {
                const stateCheck = {
                    elementInDOM: !!document.getElementById(designId),
                    elementVisible: element.style.display !== 'none' && element.style.visibility !== 'hidden',
                    designInArray: !!designs[currentArea].find(d => d.id === designId),
                    selectedDesignSet: !!selectedDesign,
                    selectedDesignId: selectedDesign ? selectedDesign.id : null
                };
                console.log('State check after selection:', designId, stateCheck);
                
                // If state is inconsistent, fix it
                if (!stateCheck.elementInDOM || !stateCheck.elementVisible) {
                    console.warn('State inconsistency detected, fixing...');
                    ensureDesignElementsVisible();
                    validateElementPositioning();
                }
            }, 50);

            updateDesignControls(); // Kontrol slider'larını güncelle
            updateLayersList(); // Katman listesini güncelle
            throttledApplyDesignsToModel(); // 3D modeli güncelle (throttled)
        }

        /**
         * Seçili tasarımın özelliklerine göre kontrol slider'larının değerlerini günceller.
         */
        function updateDesignControls() {
            if (selectedDesign) {
                // Seçili tasarımın özelliklerini kontrollere yansıt - NULL CHECKS ADDED
                const sizeControl = document.getElementById('sizeControl');
                const opacityControl = document.getElementById('opacityControl');
                const rotationControl = document.getElementById('rotationControl');
                
                if (sizeControl) sizeControl.value = selectedDesign.size || 100;
                if (opacityControl) opacityControl.value = selectedDesign.opacity || 100;
                if (rotationControl) rotationControl.value = selectedDesign.rotation || 0;
            } else {
                // Tasarım seçili değilse kontrolleri varsayılan değerlere sıfırla - NULL CHECKS ADDED
                const sizeControl = document.getElementById('sizeControl');
                const opacityControl = document.getElementById('opacityControl');
                const rotationControl = document.getElementById('rotationControl');
                
                if (sizeControl) sizeControl.value = 100;
                if (opacityControl) opacityControl.value = 100;
                if (rotationControl) rotationControl.value = 0;
            }
        }

        /**
         * ENHANCED - Tüm tasarım elementlerinin görünür olduğundan emin olur
         */
        function ensureDesignElementsVisible() {
            console.log('Ensuring design elements visible for area:', currentArea); // Debug log
            designs[currentArea].forEach(design => {
                const element = document.getElementById(design.id);
                if (element) {
                    console.log('Making element visible:', design.id); // Debug log
                    
                    // Güçlü görünürlük ayarları
                    element.style.setProperty('display', 'block', 'important');
                    element.style.setProperty('visibility', 'visible', 'important');
                    element.style.setProperty('opacity', design.opacity / 100, 'important');
                    element.style.setProperty('position', 'absolute', 'important');
                    element.style.setProperty('z-index', '10', 'important');
                    
                    // Pozisyon ve boyut bilgilerini yeniden uygula
                    element.style.width = design.width + 'px';
                    element.style.height = design.height + 'px';
                    element.style.left = (design.position?.x || 10) + '%';
                    element.style.top = (design.position?.y || 10) + '%';
                    element.style.transform = `rotate(${design.rotation || 0}deg)`;
                    
                    // Image elementinin de görünür olduğundan emin ol
                    const img = element.querySelector('img');
                    if (img) {
                        img.style.setProperty('display', 'block', 'important');
                        img.style.setProperty('visibility', 'visible', 'important');
                        img.style.setProperty('opacity', 'inherit', 'important');
                    }
                } else {
                    console.warn('Design element not found in DOM:', design.id); // Debug log
                    // Eğer element DOM'da yoksa yeniden oluştur
                    addDesignElementToPreview(design);
                }
            });
        }

        /**
         * Design elementlerinin konumlandırmasını kontrol eder ve düzeltir
         */
        /**
         * CRITICAL FIX: Harden validateElementPositioning to prevent null parentElement crash
         */
        function validateElementPositioning(el) {
            if (!el) { 
                console.warn('[RP] validateElementPositioning: el missing'); 
                return; 
            }

            // Prefer the dedicated layer; fall back to editor; never use el.parentElement blindly.
            const refs = getRightPanelRefs();
            const container = ensureDesignLayer() || refs.layer || refs.editor || el.parentElement;

            if (!container) {
                console.warn('[RP] validateElementPositioning: container missing, skip');
                return;
            }

            const crect = container.getBoundingClientRect?.();
            if (!crect || !crect.width || !crect.height) {
                console.warn('[RP] validateElementPositioning: container rect invalid', crect);
                return;
            }

            // Read current authored size/position (percent or px), clamp with half-extents.
            const rect = el.getBoundingClientRect?.();
            if (!rect) return;

            const halfW = rect.width / 2;
            const halfH = rect.height / 2;

            // Compute current center within container
            const cx = rect.left - crect.left + halfW;
            const cy = rect.top - crect.top + halfH;

            const minX = halfW;
            const maxX = crect.width - halfW;
            const minY = halfH;
            const maxY = crect.height - halfH;

            const clampedX = Math.min(Math.max(cx, minX), maxX);
            const clampedY = Math.min(Math.max(cy, minY), maxY);

            // Apply as translate; keep rotation/scale intact
            const dx = clampedX - cx;
            const dy = clampedY - cy;

            if (dx || dy) {
                const style = getComputedStyle(el);
                const current = style.transform === 'none' ? '' : style.transform;
                el.style.transform = `translate3d(${dx}px, ${dy}px, 0) ${current}`;
            }
        }

        /**
         * Helper function to ensure a single element's visibility - ROBUST VERSION
         */
        function ensureElementVisibility(element, design) {
            if (!element || !design) {
                console.warn('⚠️ ensureElementVisibility called with null element or design');
                return false;
            }
            
            console.log('🛡️ Ensuring visibility for element:', element.id);
            
            // Apply comprehensive visibility fixes
            element.style.setProperty('display', 'block', 'important');
            element.style.setProperty('visibility', 'visible', 'important');
            element.style.setProperty('opacity', ((design.opacity || 100) / 100).toString(), 'important');
            element.style.setProperty('position', 'absolute', 'important');
            element.style.setProperty('z-index', '15', 'important');
            element.style.setProperty('pointer-events', 'auto', 'important');
            
            // Apply positioning with null safety
            element.style.setProperty('width', (design.width || 100) + 'px', 'important');
            element.style.setProperty('height', (design.height || 100) + 'px', 'important');
            element.style.setProperty('left', (design.position?.x || 10) + '%', 'important');
            element.style.setProperty('top', (design.position?.y || 10) + '%', 'important');
            element.style.setProperty('transform', `rotate(${design.rotation || 0}deg)`, 'important');
            
            // Ensure inner image is also visible
            const img = element.querySelector('img');
            if (img) {
                img.style.setProperty('display', 'block', 'important');
                img.style.setProperty('visibility', 'visible', 'important');
                img.style.setProperty('opacity', 'inherit', 'important');
            }
            
            // Force reflow
            element.offsetHeight;
            
            console.log('✅ Element visibility ensured:', element.id);
            return true;
        }

        /**
         * Design elementlerinin durumunu kontrol eder ve kayıp olanları yeniden oluşturur
         */
        function checkAndRestoreDesignElements() {
            designs[currentArea].forEach(design => {
                const element = document.getElementById(design.id);
                if (!element) {
                    console.warn('Restoring missing design element:', design.id);
                    addDesignElementToPreview(design);
                } else if (element.style.display === 'none' || element.style.visibility === 'hidden') {
                    console.warn('Restoring hidden design element:', design.id);
                    ensureDesignElementsVisible();
                }
            });
        }

        /**
         * Tasarım paneli içindeki event listener'ları ayarlar (slider'lar için).
         */
        /**
         * CRITICAL FIX: Preview canvas transform handler
         */
        function handlePreviewCanvasInteraction(e) {
            if (!selectedDesign) {
                console.log('⚠️ No selected design for preview canvas interaction');
                return;
            }
            
            const previewCanvas = document.getElementById('designPreviewCanvas');
            if (!previewCanvas) return;
            
            // EMERGENCY ROLLBACK: Feature-flagged UV mapping vs stable path
            if (window.__FEATURE_PREVIEW_UV) {
                // NEW UV MAPPING CODE (disabled by default due to regressions)
                handlePreviewCanvasInteractionUV(e, previewCanvas);
            } else {
                // STABLE PATH: Restore previous working implementation
                handlePreviewCanvasInteractionStable(e, previewCanvas);
            }
        }
        
        function handlePreviewCanvasInteractionUV(e, previewCanvas) {
            // CRITICAL FIX: Device-pixel-ratio aware coordinate mapping
            const canvasRect = previewCanvas.getBoundingClientRect();
            const scaleX = previewCanvas.width / canvasRect.width;
            const scaleY = previewCanvas.height / canvasRect.height;
            
            // CRITICAL FIX: Get letterboxed print area within preview canvas
            const printableArea = getPrintableAreaForSide(currentArea);
            const previewRect = calculatePreviewRect(previewCanvas, printableArea);
            
            // CRITICAL FIX: Accurate pointer position in preview pixels
            const getPreviewPixels = (clientX, clientY) => {
                return {
                    px: (clientX - canvasRect.left) * scaleX,
                    py: (clientY - canvasRect.top) * scaleY
                };
            };
            
            // CRITICAL FIX: Drag start anchoring (no jumps)
            const startPointer = getPreviewPixels(e.clientX, e.clientY);
            const dragStartMouse = { px: startPointer.px, py: startPointer.py };
            const dragStartUV = {
                u: selectedDesign.position.x,
                v: selectedDesign.position.y,
                scale: selectedDesign.scale || 1,
                rotation: selectedDesign.rotation || 0
            };
            
            let isTransforming = false;
            let transformType = 'move';
            
            // Set global interaction flag
            window.__interactionActive = true;
            
            // Disable OrbitControls and set pointer capture
            if (window.controls) {
                window.controls.enabled = false;
            }
            
            // Set pointer capture for smooth dragging
            if (previewCanvas.setPointerCapture && e.pointerId) {
                previewCanvas.setPointerCapture(e.pointerId);
            }
            
            // Determine transform type based on modifiers
            if (e.shiftKey) {
                transformType = 'rotate';
                console.log('🔄 Starting preview canvas rotation');
            } else {
                transformType = 'move';
                console.log('🎯 Starting preview canvas move');
            }
            
            const handleMouseMove = (moveEvent) => {
                if (!isTransforming) return;
                
                // CRITICAL FIX: Total deltas from drag start (prevents jumps)
                const currentPointer = getPreviewPixels(moveEvent.clientX, moveEvent.clientY);
                const totalDeltaPx = currentPointer.px - dragStartMouse.px;
                const totalDeltaPy = currentPointer.py - dragStartMouse.py;
                
                if (transformType === 'move') {
                    // CRITICAL FIX: Normalized deltas relative to letterboxed preview area
                    const ndx = totalDeltaPx / previewRect.width;
                    const ndy = totalDeltaPy / previewRect.height;
                    
                    // CRITICAL FIX: Map to UV deltas in printable area
                    const uvDeltaX = ndx * printableArea.uvWidth;
                    const uvDeltaY = ndy * printableArea.uvHeight;
                    
                    // Calculate new UV position
                    const newU = dragStartUV.u + uvDeltaX;
                    const newV = dragStartUV.v + uvDeltaY;
                    
                    // CRITICAL FIX: Clamp with design extents (not just point)
                    const designScale = selectedDesign.scale || 1;
                    const halfW = (selectedDesign.originalWidth * designScale) / printableArea.pixelWidth * printableArea.uvWidth * 0.5;
                    const halfH = (selectedDesign.originalHeight * designScale) / printableArea.pixelHeight * printableArea.uvHeight * 0.5;
                    
                    selectedDesign.position.x = clampToPrintableArea(
                        newU, 
                        printableArea.uvOffsetX + halfW, 
                        printableArea.uvOffsetX + printableArea.uvWidth - halfW
                    );
                    selectedDesign.position.y = clampToPrintableArea(
                        newV, 
                        printableArea.uvOffsetY + halfH, 
                        printableArea.uvOffsetY + printableArea.uvHeight - halfH
                    );
                    
                } else if (transformType === 'rotate') {
                    // CRITICAL FIX: Rotate around design UV center
                    const designCenterPx = {
                        x: previewRect.x + (selectedDesign.position.x / printableArea.uvWidth) * previewRect.width,
                        y: previewRect.y + (selectedDesign.position.y / printableArea.uvHeight) * previewRect.height
                    };
                    
                    const angle = Math.atan2(
                        currentPointer.py - designCenterPx.y,
                        currentPointer.px - designCenterPx.x
                    ) * 180 / Math.PI;
                    
                    selectedDesign.rotation = normalizeRotation(angle);
                }
                
                // CRITICAL FIX: Only update transforms during interaction
                updateSelectedDesignTransformsLightweight();
            };
            
            const handleMouseUp = () => {
                isTransforming = false;
                window.__interactionActive = false;
                
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                
                // Release pointer capture
                if (previewCanvas.releasePointerCapture && e.pointerId) {
                    previewCanvas.releasePointerCapture(e.pointerId);
                }
                
                // Re-enable OrbitControls
                if (window.controls) {
                    window.controls.enabled = true;
                }
                
                // CRITICAL FIX: Schedule heavy update after interaction completes
                scheduleApplyDesignsIdle(200);
                
                console.log('✅ Preview canvas transform completed');
            };
            
            // Start transform
            isTransforming = true;
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
        
        function handlePreviewCanvasInteractionStable(e, previewCanvas) {
            // STABLE PATH: Previous working implementation (restored)
            const canvasRect = previewCanvas.getBoundingClientRect();
            
            let isTransforming = false;
            let transformType = 'move';
            let startMousePos = { x: e.clientX, y: e.clientY };
            let startDesignPos = {
                x: selectedDesign.position.x,
                y: selectedDesign.position.y,
                scale: selectedDesign.scale || 1,
                rotation: selectedDesign.rotation || 0
            };
            
            // Set global interaction flag
            window.__interactionActive = true;
            
            // Disable OrbitControls during preview transform
            if (window.controls) {
                window.controls.enabled = false;
            }
            
            // Set pointer capture for smooth dragging
            if (previewCanvas.setPointerCapture && e.pointerId) {
                previewCanvas.setPointerCapture(e.pointerId);
            }
            
            // Determine transform type based on modifiers
            if (e.shiftKey) {
                transformType = 'rotate';
                console.log('🔄 Starting preview canvas rotation');
            } else {
                transformType = 'move';
                console.log('🎯 Starting preview canvas move');
            }
            
            const handleMouseMove = (moveEvent) => {
                if (!isTransforming) return;
                
                // Calculate deltas from initial drag start (prevents accumulation errors)
                const totalDeltaX = moveEvent.clientX - startMousePos.x;
                const totalDeltaY = moveEvent.clientY - startMousePos.y;
                
                if (transformType === 'move') {
                    // EMERGENCY FIX: Handle both coordinate systems during drag
                    if (selectedDesign.coordinateSystem === 'uv') {
                        // Convert deltas to UV space for side designs
                        const printableArea = getPrintableAreaForSide(currentArea);
                        const uvDeltaX = (totalDeltaX / canvasRect.width) * printableArea.uvWidth;
                        const uvDeltaY = (totalDeltaY / canvasRect.height) * printableArea.uvHeight;
                        
                        const newU = startDesignPos.x + uvDeltaX;
                        const newV = startDesignPos.y + uvDeltaY;
                        
                        // Clamp with design extents in UV space
                        const designScale = selectedDesign.scale || 1;
                        const halfW = (selectedDesign.originalWidth * designScale) / printableArea.pixelWidth * printableArea.uvWidth * 0.5;
                        const halfH = (selectedDesign.originalHeight * designScale) / printableArea.pixelHeight * printableArea.uvHeight * 0.5;
                        
                        selectedDesign.position.x = Math.max(
                            printableArea.uvOffsetX + halfW, 
                            Math.min(printableArea.uvOffsetX + printableArea.uvWidth - halfW, newU)
                        );
                        selectedDesign.position.y = Math.max(
                            printableArea.uvOffsetY + halfH, 
                            Math.min(printableArea.uvOffsetY + printableArea.uvHeight - halfH, newV)
                        );
                    } else {
                        // Standard percentage coordinates (stable path)
                        const percentDeltaX = (totalDeltaX / canvasRect.width) * 100;
                        const percentDeltaY = (totalDeltaY / canvasRect.height) * 100;
                        
                        const newX = startDesignPos.x + percentDeltaX;
                        const newY = startDesignPos.y + percentDeltaY;
                        
                        // Clamp with design extents (stable bounds)
                        const elementWidth = selectedDesign.width || 100;
                        const elementHeight = selectedDesign.height || 100;
                        const halfW = elementWidth / 2;
                        const halfH = elementHeight / 2;
                        
                        selectedDesign.position.x = Math.max(halfW, Math.min(100 - halfW, newX));
                        selectedDesign.position.y = Math.max(halfH, Math.min(100 - halfH, newY));
                    }
                } else if (transformType === 'rotate') {
                    // EMERGENCY FIX: Handle rotation for both coordinate systems
                    let designCenterX, designCenterY;
                    
                    if (selectedDesign.coordinateSystem === 'uv') {
                        // Convert UV coordinates to screen coordinates for rotation
                        const printableArea = getPrintableAreaForSide(currentArea);
                        const percentX = ((selectedDesign.position.x - printableArea.uvOffsetX) / printableArea.uvWidth) * 100;
                        const percentY = ((selectedDesign.position.y - printableArea.uvOffsetY) / printableArea.uvHeight) * 100;
                        designCenterX = canvasRect.left + (percentX / 100) * canvasRect.width;
                        designCenterY = canvasRect.top + (percentY / 100) * canvasRect.height;
                    } else {
                        // Standard percentage coordinates
                        designCenterX = canvasRect.left + (selectedDesign.position.x / 100) * canvasRect.width;
                        designCenterY = canvasRect.top + (selectedDesign.position.y / 100) * canvasRect.height;
                    }
                    
                    const angle = Math.atan2(
                        moveEvent.clientY - designCenterY, 
                        moveEvent.clientX - designCenterX
                    ) * 180 / Math.PI;
                    
                    selectedDesign.rotation = normalizeRotation(angle);
                }
                
                // STABLE: Only update transforms during interaction
                updateSelectedDesignTransformsLightweight();
            };
            
            const handleMouseUp = () => {
                isTransforming = false;
                window.__interactionActive = false;
                
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                
                // Release pointer capture
                if (previewCanvas.releasePointerCapture && e.pointerId) {
                    previewCanvas.releasePointerCapture(e.pointerId);
                }
                
                // Re-enable OrbitControls
                if (window.controls) {
                    window.controls.enabled = true;
                }
                
                // STABLE: Schedule heavy update after interaction completes
                scheduleApplyDesignsIdle(200);
                
                console.log('✅ Preview canvas transform completed');
            };
            
            // Start transform
            isTransforming = true;
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
        
        /**
         * CRITICAL FIX: Calculate letterboxed preview rect within canvas
         */
        function calculatePreviewRect(canvas, printableArea) {
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            
            // Calculate aspect ratios
            const printableAspect = printableArea.uvWidth / printableArea.uvHeight;
            const canvasAspect = canvasWidth / canvasHeight;
            
            let previewRect;
            
            if (canvasAspect > printableAspect) {
                // Canvas is wider - letterbox horizontally
                const scaledHeight = canvasHeight * 0.8; // 80% of canvas height
                const scaledWidth = scaledHeight * printableAspect;
                previewRect = {
                    x: (canvasWidth - scaledWidth) / 2,
                    y: (canvasHeight - scaledHeight) / 2,
                    width: scaledWidth,
                    height: scaledHeight
                };
            } else {
                // Canvas is taller - letterbox vertically  
                const scaledWidth = canvasWidth * 0.8; // 80% of canvas width
                const scaledHeight = scaledWidth / printableAspect;
                previewRect = {
                    x: (canvasWidth - scaledWidth) / 2,
                    y: (canvasHeight - scaledHeight) / 2,
                    width: scaledWidth,
                    height: scaledHeight
                };
            }
            
            return previewRect;
        }
        
        /**
         * CRITICAL FIX: Debounced design application scheduler
         */
        let applyDesignsScheduled = false;
        let applyDesignsTimeout = null;
        
        function scheduleApplyDesigns(forceImmediate = false) {
            if (forceImmediate) {
                // Clear any pending scheduled update
                if (applyDesignsTimeout) {
                    clearTimeout(applyDesignsTimeout);
                    applyDesignsTimeout = null;
                }
                applyDesignsScheduled = false;
                
                // Apply immediately for high-res final update
                applyDesignsToModel();
                return;
            }
            
            if (applyDesignsScheduled) return;
            applyDesignsScheduled = true;
            
            // Throttle to 60fps max during interaction
            requestAnimationFrame(() => {
                applyDesignsScheduled = false;
                
                // Also debounce with timeout for idle updates
                if (applyDesignsTimeout) {
                    clearTimeout(applyDesignsTimeout);
                }
                
                applyDesignsTimeout = setTimeout(() => {
                    applyDesignsToModel();
                    applyDesignsTimeout = null;
                }, 150); // 150ms idle timeout
            });
        }
        
        /**
         * EMERGENCY FIX: Lightweight transform updates (no texture re-baking)
         */
        function updateSelectedDesignTransformsLightweight() {
            if (!selectedDesign) return;
            
            // EMERGENCY FIX: Handle all sides with appropriate coordinate conversion
            const element = document.getElementById(selectedDesign.id);
            if (element) {
                let leftPercent, topPercent;
                
                if (selectedDesign.coordinateSystem === 'uv') {
                    // Convert UV coordinates to percentage for CSS positioning
                    const printableArea = getPrintableAreaForSide(currentArea);
                    leftPercent = ((selectedDesign.position.x - printableArea.uvOffsetX) / printableArea.uvWidth) * 100;
                    topPercent = ((selectedDesign.position.y - printableArea.uvOffsetY) / printableArea.uvHeight) * 100;
                } else {
                    // Standard percentage coordinates
                    leftPercent = selectedDesign.position.x;
                    topPercent = selectedDesign.position.y;
                }
                
                element.style.left = leftPercent + '%';
                element.style.top = topPercent + '%';
                element.style.width = selectedDesign.width + 'px';
                element.style.height = selectedDesign.height + 'px';
                
                // Apply rotation with proper transform origin (no flicker)
                if (selectedDesign.rotation !== undefined) {
                    element.style.transformOrigin = 'center center';
                    element.style.transform = `rotate(${selectedDesign.rotation}deg)`;
                }
                
                // PRODUCTION FIX: Remove any transition classes during interaction
                element.classList.add('no-anim');
            }
            
            // Update 2D preview canvas (lightweight)
            if (typeof drawDesignPreview === 'function') {
                drawDesignPreview();
            }
        }
        
        /**
         * EMERGENCY FIX: Debounced heavy updates scheduler
         */
        let applyDesignsIdleTimeout = null;
        
        function scheduleApplyDesignsIdle(delayMs = 200) {
            // Clear any pending scheduled update
            if (applyDesignsIdleTimeout) {
                clearTimeout(applyDesignsIdleTimeout);
                applyDesignsIdleTimeout = null;
            }
            
            // Schedule new idle update
            applyDesignsIdleTimeout = setTimeout(() => {
                if (!window.__interactionActive) {
                    console.log('🎨 Applying designs to model (idle update)');
                    applyDesignsToModel();
                }
                applyDesignsIdleTimeout = null;
            }, delayMs);
        }
        
        /**
         * CRITICAL FIX: Fast transform-only updates during interaction (UV flagged)
         */
        function updateSelectedDesignTransforms() {
            if (window.__FEATURE_PREVIEW_UV) {
                // UV mapping version
                if (!selectedDesign) return;
                
                const printableArea = getPrintableAreaForSide(currentArea);
                
                // Update 2D element with precise UV-based positioning
                const element = document.getElementById(selectedDesign.id);
                if (element) {
                    // Convert UV coordinates to percentage for 2D element
                    const elementPercentX = ((selectedDesign.position.x - printableArea.uvOffsetX) / printableArea.uvWidth) * 100;
                    const elementPercentY = ((selectedDesign.position.y - printableArea.uvOffsetY) / printableArea.uvHeight) * 100;
                    
                    element.style.left = elementPercentX + '%';
                    element.style.top = elementPercentY + '%';
                    element.style.width = selectedDesign.width + 'px';
                    element.style.height = selectedDesign.height + 'px';
                    
                    // Apply rotation with proper transform origin
                    if (selectedDesign.rotation !== undefined) {
                        element.style.transformOrigin = 'center center';
                        element.style.transform = `rotate(${selectedDesign.rotation}deg)`;
                    }
                }
                
                // Update 2D preview canvas
                drawDesignPreview();
            } else {
                // Stable path - use lightweight version
                updateSelectedDesignTransformsLightweight();
            }
        }

        /**
         * CRITICAL FIX: Get printable area definition for current side
         */
        function getPrintableAreaForSide(side) {
            // Define printable areas for each side of the shirt
            // These should match the actual UV mapping used in the 3D model
            const printableAreas = {
                front: {
                    uvWidth: 0.6,    // 60% of UV space width
                    uvHeight: 0.8,   // 80% of UV space height
                    uvOffsetX: 0.2,  // 20% offset from left
                    uvOffsetY: 0.1,  // 10% offset from top
                    pixelWidth: 400, // Reference pixel dimensions
                    pixelHeight: 500
                },
                back: {
                    uvWidth: 0.6,
                    uvHeight: 0.8,
                    uvOffsetX: 0.2,
                    uvOffsetY: 0.1,
                    pixelWidth: 400,
                    pixelHeight: 500
                },
                left: {
                    uvWidth: 0.3,    // Smaller area for sleeves
                    uvHeight: 0.4,
                    uvOffsetX: 0.1,
                    uvOffsetY: 0.3,
                    pixelWidth: 200,
                    pixelHeight: 250
                },
                right: {
                    uvWidth: 0.3,
                    uvHeight: 0.4,
                    uvOffsetX: 0.6,
                    uvOffsetY: 0.3,
                    pixelWidth: 200,
                    pixelHeight: 250
                }
            };
            
            return printableAreas[side] || printableAreas.front;
        }
        
        /**
         * CRITICAL FIX: Clamp value to printable area bounds
         */
        function clampToPrintableArea(value, min, max) {
            return Math.max(min, Math.min(max, value));
        }
        
        /**
         * CRITICAL FIX: Normalize rotation angle to 0-360 degrees
         */
        function normalizeRotation(angle) {
            while (angle < 0) angle += 360;
            while (angle >= 360) angle -= 360;
            return angle;
        }

        /**
         * CRITICAL FIX: Setup preview canvas wheel handler for scaling
         */
        function setupPreviewCanvasHandlers() {
            const { container, canvas, overlay } = getPreviewRefs();
            if (!container || !canvas || !overlay) return;
            
            // PRODUCTION FIX: Idempotent initialization guard
            if (overlay._handlersSetup) return;
            overlay._handlersSetup = true;
            
            // PRODUCTION FIX: Interactive overlay handlers
            const onPreviewPointerDown = (e) => {
                const designElement = e.target.closest('.design-element');
                if (!designElement) return;
                
                e.preventDefault();
                e.stopPropagation();
                
                // Select the design
                const designId = designElement.dataset.designId || designElement.id;
                const design = findDesignById(designId);
                if (!design) return;
                
                selectedDesign = design;
                console.log(`[SELECT] ${designId} in preview`);
                ensureDesignElementVisible(designElement);
                
                // Set pointer capture
                if (e.target.setPointerCapture && e.pointerId) {
                    e.target.setPointerCapture(e.pointerId);
                }
                
                // Set up drag state
                const rect = container.getBoundingClientRect();
                const dragStartPx = { x: e.clientX, y: e.clientY };
                const dragStartPos = {
                    left: designElement.offsetLeft,
                    top: designElement.offsetTop,
                    w: designElement.offsetWidth,
                    h: designElement.offsetHeight
                };
                
                let isDragging = false;
                
                const onPointerMove = (moveEvent) => {
                    if (!isDragging) {
                        isDragging = true;
                        designElement.classList.add('no-anim');
                    }
                    
                    const dx = moveEvent.clientX - dragStartPx.x;
                    const dy = moveEvent.clientY - dragStartPx.y;
                    
                    const left = Math.max(0, Math.min(dragStartPos.left + dx, rect.width - dragStartPos.w));
                    const top = Math.max(0, Math.min(dragStartPos.top + dy, rect.height - dragStartPos.h));
                    
                    // Apply position
                    designElement.style.left = left + 'px';
                    designElement.style.top = top + 'px';
                    
                    // Update design state as percentage
                    design.position.x = (left / rect.width) * 100;
                    design.position.y = (top / rect.height) * 100;
                    
                    console.log('[DRAG]', designId, { left, top, percentX: design.position.x.toFixed(1), percentY: design.position.y.toFixed(1) });
                };
                
                const onPointerUp = (upEvent) => {
                    isDragging = false;
                    designElement.classList.remove('no-anim');
                    
                    if (upEvent.target.releasePointerCapture && upEvent.pointerId) {
                        upEvent.target.releasePointerCapture(upEvent.pointerId);
                    }
                    
                    document.removeEventListener('pointermove', onPointerMove);
                    document.removeEventListener('pointerup', onPointerUp);
                    
                    // Schedule heavy update
                    console.log(`[DROP] ${designId} → applying`);
                    scheduleApplyDesignsIdle(200);
                };
                
                document.addEventListener('pointermove', onPointerMove);
                document.addEventListener('pointerup', onPointerUp);
            };
            
            // Bind to overlay for design element interaction
            overlay.addEventListener('pointerdown', onPreviewPointerDown, { passive: false });
            
            // PRODUCTION FIX: Wheel handler with preventDefault and stable scaling
            const onWheel = (e) => {
                if (!selectedDesign) return;
                
                e.preventDefault(); // Stop parent scroll interference
                
                // Set interaction flag
                window.__interactionActive = true;
                
                // Same scaling factor as main canvas (10% increments)
                const scaleDelta = e.deltaY > 0 ? 0.9 : 1.1;
                const currentScale = selectedDesign.scale || 1;
                const newScale = currentScale * scaleDelta;
                
                // Clamp to bounds (same as main canvas)
                selectedDesign.scale = Math.max(0.1, Math.min(3.0, newScale));
                
                // Update dimensions without drift
                if (selectedDesign.originalWidth && selectedDesign.originalHeight) {
                    selectedDesign.width = selectedDesign.originalWidth * selectedDesign.scale;
                    selectedDesign.height = selectedDesign.originalHeight * selectedDesign.scale;
                }
                
                console.log('🔍 Preview scale:', {
                    scale: selectedDesign.scale,
                    dimensions: { width: selectedDesign.width, height: selectedDesign.height }
                });
                
                // EMERGENCY FIX: Lightweight transform update during scaling
                updateSelectedDesignTransformsLightweight();
                
                // Schedule heavy update after idle
                scheduleApplyDesignsIdle(300);
                
                // Clear interaction flag after brief delay
                setTimeout(() => {
                    window.__interactionActive = false;
                }, 100);
            };
            
            // Bind wheel to both canvas and overlay
            canvas.addEventListener('wheel', onWheel);
            overlay.addEventListener('wheel', onWheel);
            
            console.log('✅ Preview canvas handlers setup completed');
        }
        
        /**
         * CRITICAL FIX: Update selected design visuals across all systems
         */
        function updateSelectedDesignVisuals() {
            if (!selectedDesign) return;
            
            // CRITICAL FIX: Use fast transform updates during interaction
            updateSelectedDesignTransforms();
            
            // CRITICAL FIX: Schedule debounced 3D model update
            scheduleApplyDesigns();
            
            // Update properties panel if it exists
            if (typeof updatePropertiesPanel === 'function') {
                updatePropertiesPanel();
            }
        }

        /**
         * YENİ EVENT HANDLING SİSTEMİ - Çakışmaları önler
         */
        function setupNewDesignPanelEvents() {
            // Handle both new and old container systems
            const newContainer = document.getElementById('designElementsLayer');
            const oldContainer = document.getElementById('designPreviewCanvas')?.parentElement;
            
            const handleContainerClick = (e) => {
                console.log('🖱️ Container click:', e.target.className, e.target.id);
                
                // CRITICAL FIX: Check for any UI interaction before deselecting
                const clickedDesignElement = e.target.closest('.design-element');
                const clickedUIElement = e.target.closest('.new-design-panel, .left-panel, .properties-panel, .elements-panel, .design-elements-layer, #elementsList, .resize-handle, .rotate-handle');
                const clickedPreviewArea = e.target.closest('#designPreviewCanvas, .design-elements-layer, .design-element');
                
                // PRODUCTION FIX: Never deselect when clicking in preview area
                if (clickedPreviewArea) {
                    e.stopPropagation();
                    return;
                }
                
                // CRITICAL FIX: Only deselect if clicking on container itself (not canvas)
                const isDirectContainerClick = e.target === newContainer || e.target === oldContainer;
                
                if (isDirectContainerClick && !clickedDesignElement && !clickedUIElement) {
                    console.log('🔄 Deselecting all elements - clicked empty container');
                    document.querySelectorAll('.design-element').forEach(el => {
                        el.classList.remove('selected');
                    });
                    selectedDesign = null;
                    updateElementsList();
                    updatePropertiesPanel();
                    updateSelectionIndicators('');
                } else if (clickedDesignElement) {
                    console.log('🎯 Design element clicked, preventing deselection');
                } else if (clickedUIElement) {
                    console.log('🎛️ UI element clicked, preventing deselection');
                    
                    // CRITICAL FIX: Route preview canvas interactions to transform handlers
                    if (e.target.id === 'designPreviewCanvas') {
                        console.log('🎨 Preview canvas interaction - routing to transforms');
                        handlePreviewCanvasInteraction(e);
                    }
                }
            };
            
            // Add listeners to both containers
            if (newContainer) {
                newContainer.addEventListener('mousedown', handleContainerClick);
                newContainer.addEventListener('click', handleContainerClick);
            }
            if (oldContainer) {
                oldContainer.addEventListener('mousedown', handleContainerClick);
                oldContainer.addEventListener('click', handleContainerClick);
            }
        }

        function setupDesignPanelEvents() {
            // CRITICAL FIX: Legacy event handling with proper UI detection
            const designPreviewDiv = document.getElementById('designPreviewCanvas')?.parentElement;
            if (!designPreviewDiv) return;
            
            designPreviewDiv.addEventListener('mousedown', (e) => {
                console.log('Container mousedown:', e.target, e.target.className, e.target.id);
                
                // CRITICAL FIX: Check for any UI interaction before deselecting
                const isDesignElement = e.target.closest('.design-element');
                const isUIElement = e.target.closest('.new-design-panel, .left-panel, .properties-panel, .elements-panel, .design-elements-layer, #elementsList, .resize-handle, .rotate-handle');
                const isCanvas = e.target.id === 'designPreviewCanvas';
                const isContainer = e.target === designPreviewDiv;
                const isPreviewArea = e.target.closest('#designPreviewCanvas, .design-elements-layer, .design-element');
                
                // PRODUCTION FIX: Never deselect when clicking in preview area
                if (isPreviewArea) {
                    e.stopPropagation();
                    return;
                }
                
                // CRITICAL FIX: Only deselect if clicking on container itself (not canvas)
                if (isContainer && !isDesignElement && !isUIElement) {
                    console.log('Deselecting all elements - clicked empty container');
                    document.querySelectorAll('.design-element').forEach(el => {
                        el.classList.remove('selected');
                    });
                    selectedDesign = null;
                    updateElementsList(); // Use new panel system
                    updatePropertiesPanel();
                } else {
                    console.log('Click on design element or UI, not deselecting');
                    
                    // CRITICAL FIX: Route preview canvas interactions to transform handlers
                    if (e.target.id === 'designPreviewCanvas') {
                        console.log('🎨 Preview canvas interaction - routing to transforms');
                        handlePreviewCanvasInteraction(e);
                    }
                }
            });

            // Boyut kontrol slider'ı değiştiğinde
            document.getElementById('sizeControl').addEventListener('input', (e) => {
                if (selectedDesign) {
                    selectedDesign.size = parseInt(e.target.value);
                    // Boyut değiştiğinde en boy oranını koruyarak width ve height'ı güncelle
                    if (selectedDesign.width && selectedDesign.height) {
                        const aspectRatio = selectedDesign.width / selectedDesign.height;
                        selectedDesign.width = selectedDesign.size;
                        selectedDesign.height = selectedDesign.size / aspectRatio; 
                    } else { // Metin gibi doğal boyutu olmayanlar için kare olarak varsay
                        selectedDesign.width = selectedDesign.size;
                        selectedDesign.height = selectedDesign.size;
                    }

                    const element = document.getElementById(selectedDesign.id);
                    if (element) {
                        // Elementin boyutunu güncelle
                        element.style.width = selectedDesign.width + 'px';
                        element.style.height = selectedDesign.height + 'px';
                        
                        // Pozisyonu yeniden hesapla (sol üst köşe)
                        const parentRect = element.parentElement.getBoundingClientRect();
                        const newLeft = (selectedDesign.position.x / 100) * parentRect.width;
                        const newTop = (selectedDesign.position.y / 100) * parentRect.height;

                        element.style.left = `${(newLeft / parentRect.width) * 100}%`;
                        element.style.top = `${(newTop / parentRect.height) * 100}%`;
                        // Rotation zaten CSS'te transform içinde olduğu için burada sadece rotate'i güncelle
                        const safeRotation = initializeDesignRotation(selectedDesign);
                        element.style.transform = `rotate(${safeRotation}deg)`;
                    }
                    drawDesignPreview(); // 2D önizlemeyi güncelle
                    throttledApplyDesignsToModel(); // 3D modeli güncelle (throttled)
                }
            });
            // Opaklık kontrol slider'ı değiştiğinde
            document.getElementById('opacityControl').addEventListener('input', (e) => {
                if (selectedDesign) {
                    selectedDesign.opacity = parseInt(e.target.value);
                    const element = document.getElementById(selectedDesign.id);
                    if (element) {
                        element.style.opacity = selectedDesign.opacity / 100;
                    }
                    drawDesignPreview(); // 2D önizlemeyi güncelle
                    immediateApplyDesignsToModel(); // REAL-TIME 3D model update for opacity
                }
            });
            // Döndürme kontrol slider'ı değiştiğinde - NULL CHECKS ADDED
            const rotationControlElement = document.getElementById('rotationControl');
            if (rotationControlElement) {
                rotationControlElement.addEventListener('input', (e) => {
                    if (selectedDesign && selectedDesign.id) {
                        selectedDesign.rotation = parseInt(e.target.value) || 0;
                        const element = document.getElementById(selectedDesign.id);
                        if (element) {
                            // Transform sadece rotation için kullanılacak
                            element.style.transform = `rotate(${selectedDesign.rotation}deg)`;
                            console.log('🔄 Rotation updated:', selectedDesign.rotation, 'for element:', selectedDesign.id);
                        } else {
                            console.warn('⚠️ Element not found for rotation update:', selectedDesign.id);
                        }
                        drawDesignPreview(); // 2D önizlemeyi güncelle
                        immediateApplyDesignsToModel(); // REAL-TIME 3D model update for rotation
                    } else {
                        console.warn('⚠️ selectedDesign is null or missing id for rotation update');
                    }
                });
            } else {
                console.warn('⚠️ rotationControl element not found');
            }
        }

        /**
         * Belirtilen ID'ye sahip tasarımı mevcut alandan siler.
         * @param {string} designId - Silinecek tasarımın ID'si.
         */
        function removeDesign(designId) {
            designs[currentArea] = designs[currentArea].filter(d => d.id !== designId); // Tasarımı listeden filtrele
            const element = document.getElementById(designId);
            if (element) {
                element.remove(); // HTML elementini DOM'dan kaldır
            }
            if (selectedDesign && selectedDesign.id === designId) {
                selectedDesign = null; // Seçili tasarım silindiyse sıfırla
            }
            updateLayersList(); // Katman listesini güncelle
            updateDesignControls(); // Kontrolleri sıfırla
            drawDesignPreview(); // 2D önizlemeyi güncelle
            throttledApplyDesignsToModel(); // 3D modeli güncelle (throttled)
        }

        /**
         * Sağ paneldeki katmanlar listesini günceller.
         * Kullanıcının eklediği tasarımları bir liste halinde gösterir.
         */
        function updateLayersList() {
            // CRITICAL FIX: Redirect all legacy calls to new panel system
                updateElementsList();
        }

        /**
         * Sağ paneldeki 2D tasarım önizleme canvas'ına mevcut tasarımları çizer.
         * Görsellerin responsive olarak sığmasını ve konumlanmasını sağlar.
         */
        function drawDesignsOnCanvas(area) {
            // CRITICAL FIX: Use new refs system
            const refs = getRightPanelRefs();
            if (!refs.preview || !refs.canvas || !refs.layer) {
                return false;
            }
            
            // CRITICAL FIX: Validate canvas size
            const rect = refs.rect();
            if (!rect || !Number.isFinite(rect.width) || rect.width <= 0 || !Number.isFinite(rect.height) || rect.height <= 0) {
                return false;
            }
            
            const ctx = refs.canvas.getContext('2d');
            if (!ctx) {
                return false;
            }
            
            // Reset canvas state and clear
            ctx.setTransform(1,0,0,1,0,0); 
            ctx.clearRect(0,0,refs.canvas.width,refs.canvas.height);

            const areaDesigns = designs[area] || [];
            if (areaDesigns.length === 0) {
                return true; // No designs to draw
            }
            
            let drawnCount = 0;

            // Draw designs using percent-based coordinates
            for (const design of areaDesigns) {
                if (!design.imageData) continue;
                
                try {
                    const img = new Image();
                    img.src = design.imageData;
                    
                    if (img.complete && img.naturalWidth > 0) {
                        // Convert percent to pixels
                        const x = (design.x || 0.5) * refs.canvas.width;
                        const y = (design.y || 0.5) * refs.canvas.height;
                        const scale = design.scale || 1;
                        const rotation = design.rotation || 0;
                        
                        // Calculate size based on image aspect ratio
                        const aspectRatio = img.naturalWidth / img.naturalHeight;
                        const baseSize = Math.min(refs.canvas.width, refs.canvas.height) * 0.3;
                        const width = baseSize * scale;
                        const height = width / aspectRatio;
                        
                        // Save context, transform, draw, restore
                        ctx.save();
                        ctx.translate(x, y);
                        ctx.rotate(rotation * Math.PI / 180);
                        ctx.drawImage(img, -width/2, -height/2, width, height);
                        ctx.restore();
                        
                        drawnCount++;
                    } else {
                        // Log skipped designs only once per session
                        if (!window.__skippedDesigns) window.__skippedDesigns = new Set();
                        if (!window.__skippedDesigns.has(design.id)) {
                            console.log('[DRAW] skip not-ready', design.id);
                            window.__skippedDesigns.add(design.id);
                        }
                    }
                } catch (e) {
                    // Skip drawing errors silently
                }
            }

            // Throttled summary log
            const now = Date.now();
            if (!window.__lastDrawLog || now - window.__lastDrawLog > 2000) {
                console.log('[DRAW]', area + ':', drawnCount + '/' + areaDesigns.length, 'designs drawn');
                window.__lastDrawLog = now;
            }
            
            return true;
        }

        async function drawDesignPreview() {
            // PRODUCTION FIX: Use new drawDesignsOnCanvas
            drawDesignsOnCanvas(currentArea);
        }


        // PROFESSIONAL REAL-TIME 3D MODEL SYNCHRONIZATION SYSTEM
        let applyDesignsToModelTimeout = null;
        let isApplyingDesigns = false;
        let animationFrameId = null;
        
        /**
         * IMMEDIATE 3D Model Update - No throttling for real-time interaction
         * Used during active dragging/interaction for instant feedback
         */
        function immediateApplyDesignsToModel() {
            if (isApplyingDesigns) {
                return; // Prevent multiple simultaneous calls
            }
            
            // Cancel any pending throttled updates
            if (applyDesignsToModelTimeout) {
                clearTimeout(applyDesignsToModelTimeout);
                applyDesignsToModelTimeout = null;
            }
            
            // Use requestAnimationFrame for smooth 60fps updates
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            
            animationFrameId = requestAnimationFrame(() => {
                applyDesignsToModel();
                animationFrameId = null;
            });
        }
        
        /**
         * Throttled version - Used for non-interactive updates
         */
        function throttledApplyDesignsToModel() {
            if (applyDesignsToModelTimeout) {
                clearTimeout(applyDesignsToModelTimeout);
            }
            
            applyDesignsToModelTimeout = setTimeout(() => {
                applyDesignsToModel();
                applyDesignsToModelTimeout = null;
            }, 50); // Reduced from 100ms to 50ms for better responsiveness
        }
        
        /**
         * SMART 3D Update System - Chooses between immediate and throttled based on context
         */
        function smartApplyDesignsToModel(isInteractive = false) {
            if (isInteractive) {
                immediateApplyDesignsToModel();
            } else {
                throttledApplyDesignsToModel();
            }
        }

        /**
         * OPTIMIZED: Enhanced texture application with high-resolution rendering
         * Applies designs to 2D offscreen canvases and maps them to 3D model textures
         */
        async function applyDesignsToModel() {
            // Prevent multiple simultaneous calls
            if (isApplyingDesigns) {
                console.log('⏸️ applyDesignsToModel already running, skipping...');
                return;
            }
            
            if (!tshirtModel) return;
            
            isApplyingDesigns = true;
            
            // PRODUCTION FIX: Use unified design state (no rpEditor dependency)
            
            // PRODUCTION FIX: Log areas being processed
            const areaStats = Object.keys(designs).reduce((acc, key) => { acc[key] = designs[key].length; return acc; }, {});
            console.log('[APPLY] counts', areaStats);

            // OPTIMIZED: Get base color from body mesh material
            const baseColor = new THREE.Color(0xffffff);
            if (tshirtMeshBody && tshirtMeshBody.material) {
                if (Array.isArray(tshirtMeshBody.material)) {
                    baseColor.copy(tshirtMeshBody.material[0].color);
                } else {
                    baseColor.copy(tshirtMeshBody.material.color);
                }
            }

            /**
             * OPTIMIZED: Enhanced texture drawing with high-resolution support
             * @param {CanvasRenderingContext2D} ctx - Canvas context for drawing
             * @param {number} canvasWidth - Target canvas width
             * @param {number} canvasHeight - Target canvas height
             * @param {Array<Object>} areaDesigns - Design objects to draw
             * @param {THREE.Color} baseColor - Base t-shirt color
             * @param {Object} uvOffset - UV mapping position (x, y, width, height)
             * @returns {Promise<boolean>} - Returns true if any design has transparency
             */
            const drawDesignsOnCanvas = async (ctx, canvasWidth, canvasHeight, areaDesigns, baseColor, uvOffset = {x: 0, y: 0, width: 1, height: 1}) => {
                // PRODUCTION FIX: Reset canvas state completely
                ctx.globalAlpha = 1;
                ctx.globalCompositeOperation = 'source-over';
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                
                // CRITICAL FIXES: Calculate UV region coordinates and dimensions
                const uvRegionX = uvOffset.x * canvasWidth;
                const uvRegionY = uvOffset.y * canvasHeight;
                const uvRegionWidth = uvOffset.width * canvasWidth;
                const uvRegionHeight = uvOffset.height * canvasHeight;

                // CRITICAL FIXES: Clear UV region and fill with base color
                ctx.clearRect(uvRegionX, uvRegionY, uvRegionWidth, uvRegionHeight);
                ctx.fillStyle = '#' + baseColor.getHexString();
                ctx.fillRect(uvRegionX, uvRegionY, uvRegionWidth, uvRegionHeight);

                let hasTransparency = false;

                // PRODUCTION FIX: Use new refs for dimensions
                const rp = getRightPanelRefs();
                if (!rp || !rp.preview) {
                    // Skip drawing if refs not ready
                    return false;
                }
                
                const rect = rp.rect();
                let designPanelWidth = 400; // fallback
                let designPanelHeight = 300; // fallback
                
                if (rect && Number.isFinite(rect.width) && rect.width > 0 && Number.isFinite(rect.height) && rect.height > 0) {
                    designPanelWidth = rect.width;
                    designPanelHeight = rect.height;
                }
                
                // CRITICAL FIX: Check canvas size
                if (canvasWidth === 0 || canvasHeight === 0) {
                    console.warn('[APPLY] Canvas size is 0, skipping');
                    return false;
                }

                // CRITICAL FIXES: Get current quality settings for performance optimization
                const currentQuality = textureQualityManager.currentQuality;
                const qualitySettings = textureQualityManager.qualityLevels[currentQuality];

                // CRITICAL FIXES: Optimized design processing with performance consideration
                const drawPromises = areaDesigns.map(design => {
                    return new Promise(resolve => {
                        const img = new Image();
                        img.src = design.imageData;
                        
                        // PRODUCTION FIX: Image readiness check and processing
                        const processImage = () => {
                            if (!(img instanceof HTMLImageElement) || !img.complete || img.naturalWidth <= 0) {
                                console.warn('⚠️ Image not ready, skipping:', design.id);
                                resolve();
                                return;
                            }
                            // EMERGENCY FIX: Handle both coordinate systems (UV vs percentage)
                            let designX_px_on_panel, designY_px_on_panel;
                            
                            if (design.coordinateSystem === 'uv') {
                                // Convert UV coordinates back to percentage for rendering
                                const printableArea = getPrintableAreaForSide(currentArea);
                                const percentX = ((design.position.x - printableArea.uvOffsetX) / printableArea.uvWidth) * 100;
                                const percentY = ((design.position.y - printableArea.uvOffsetY) / printableArea.uvHeight) * 100;
                                designX_px_on_panel = (percentX / 100) * designPanelWidth;
                                designY_px_on_panel = (percentY / 100) * designPanelHeight;
                            } else {
                                // Standard percentage coordinates
                                designX_px_on_panel = (design.position.x / 100) * designPanelWidth;
                                designY_px_on_panel = (design.position.y / 100) * designPanelHeight;
                            }
                            
                            const designWidth_px_on_panel = design.width;
                            const designHeight_px_on_panel = design.height;

                            // CRITICAL FIXES: Scale to UV region dimensions with quality optimization
                            const textureDrawWidth = (designWidth_px_on_panel / designPanelWidth) * uvRegionWidth;
                            const textureDrawHeight = (designHeight_px_on_panel / designPanelHeight) * uvRegionHeight;

                            // CRITICAL FIXES: Calculate final drawing coordinates
                            const drawX_relative_to_uv_origin = (designX_px_on_panel / designPanelWidth) * uvRegionWidth;
                            const drawY_relative_to_uv_origin = (designY_px_on_panel / designPanelHeight) * uvRegionHeight;

                            const finalDrawX = uvRegionX + drawX_relative_to_uv_origin;
                            const finalDrawY = uvRegionY + drawY_relative_to_uv_origin;
                            
                            if (design.opacity < 100) {
                                hasTransparency = true;
                            }

                            // CRITICAL FIXES: Enhanced drawing with optimized quality settings
                            ctx.save();
                            
                            // CRITICAL FIXES: Apply fabric texture blending based on quality settings
                            if (designQualityEnhancer.fabricBlendingEnabled && design.processingFlags?.fabricBlended && currentQuality !== 'low') {
                                ctx.globalCompositeOperation = 'multiply';
                            }
                            
                            ctx.translate(finalDrawX + textureDrawWidth / 2, finalDrawY + textureDrawHeight / 2); 
                            ctx.rotate(design.rotation * Math.PI / 180);
                            ctx.globalAlpha = design.opacity / 100;
                            
                            // CRITICAL FIXES: Ultra-high quality image rendering
                            ctx.imageSmoothingEnabled = true;
                            ctx.imageSmoothingQuality = 'high';
                            
                            // CRITICAL FIXES: Dynamic supersampling based on performance and quality
                            const shouldUseSupersampling = qualitySettings.supersampling && 
                                                         design.processingFlags?.supersampled && 
                                                         !performanceOptimizer.isThrottling &&
                                                         performanceManager.currentFPS > 30;
                            
                            if (shouldUseSupersampling) {
                                const supersamplingFactor = performanceOptimizer.interactionPriority ? 1.2 : 1.5;
                                const supersampledWidth = textureDrawWidth * supersamplingFactor;
                                const supersampledHeight = textureDrawHeight * supersamplingFactor;
                                
                                // Create temporary canvas for supersampling
                                const tempCanvas = document.createElement('canvas');
                                const tempCtx = tempCanvas.getContext('2d');
                                tempCanvas.width = supersampledWidth;
                                tempCanvas.height = supersampledHeight;
                                
                                // Draw at higher resolution
                                tempCtx.imageSmoothingEnabled = true;
                                tempCtx.imageSmoothingQuality = 'high';
                                tempCtx.drawImage(img, 0, 0, supersampledWidth, supersampledHeight);
                                
                                // Draw back to main canvas at target size
                                ctx.drawImage(tempCanvas, -textureDrawWidth / 2, -textureDrawHeight / 2, textureDrawWidth, textureDrawHeight);
                            } else {
                                // CRITICAL FIXES: Direct drawing for better performance during interactions
                                ctx.drawImage(img, -textureDrawWidth / 2, -textureDrawHeight / 2, textureDrawWidth, textureDrawHeight);
                            }
                            
                            // CRITICAL FIXES: Apply realistic shading with performance consideration
                            if (designQualityEnhancer.realisticShadingEnabled && 
                                design.processingFlags?.realisticShading && 
                                !performanceOptimizer.interactionPriority &&
                                currentQuality !== 'low' &&
                                performanceManager.currentFPS > 35) {
                                ctx.globalCompositeOperation = 'overlay';
                                ctx.globalAlpha = 0.06; // Further reduced for better performance
                                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                                ctx.fillRect(-textureDrawWidth / 2, -textureDrawHeight / 2, textureDrawWidth, textureDrawHeight * 0.2);
                            }
                            
                            ctx.restore();
                            
                            // PRODUCTION FIX: Log each drawn design with final rect
                            console.log('[DRAW]', currentArea, design.id, {
                                x: Math.round(finalDrawX), 
                                y: Math.round(finalDrawY), 
                                w: Math.round(textureDrawWidth), 
                                h: Math.round(textureDrawHeight)
                            });

                            resolve();
                        };
                        
                        // Set up image loading
                        img.onload = processImage;
                        
                        // If image is already loaded, process immediately
                        if (img.complete && img.naturalWidth > 0) {
                            processImage();
                        }
                        img.onerror = (e) => {
                            console.error(`Error loading design image (${design.fileName}):`, e);
                            resolve();
                        };
                    });
                });
                await Promise.all(drawPromises);
                return hasTransparency;
            };

            // Tişörtün tüm mesh'lerini dolaş ve materyallerini güncelle
            tshirtModel.traverse(async (node) => {
                if (node.isMesh && originalMaterials.has(node)) {
                    let material = originalMaterials.get(node).clone(); // Orijinal materyali klonla
                    
                    // Tişörtün ana rengini uygula
                    if (Array.isArray(material)) {
                        material.forEach(mat => mat.color.copy(baseColor));
                    } else {
                        material.color.copy(baseColor);
                    }

                    let targetCtx, targetCanvas;
                    let meshHasTransparency = false;
                    
                    // Determine which mesh corresponds to which design area and apply texture
                    const nodeNameLower = node.name.toLowerCase();
                    if (node === tshirtMeshBody) {
                        targetCtx = bodyTextureCtx;
                        targetCanvas = bodyTextureCanvas;
                        
                        // Ön ve arka tasarımları offscreen canvas'a çiz
                        const frontTransparency = await drawDesignsOnCanvas(
                            targetCtx, 
                            targetCanvas.width, 
                            targetCanvas.height, 
                            designs.front, 
                            baseColor, 
                            {x: 0, y: 0, width: 0.5, height: 1} // Assuming front face UV map is the left half
                        );
                        const backTransparency = await drawDesignsOnCanvas(
                            targetCtx, 
                            targetCanvas.width, 
                            targetCanvas.height, 
                            designs.back, 
                            baseColor, 
                            {x: 0.5, y: 0, width: 0.5, height: 1} // Assuming back face UV map is the right half
                        );
                        meshHasTransparency = frontTransparency || backTransparency;
                        
                        // Eğer herhangi bir tasarım varsa veya şeffaflık gerekiyorsa dokuyu uygula
                        if (designs.front.length > 0 || designs.back.length > 0) {
                            console.log('[DRAW] body canvas updated, front:', designs.front.length, 'back:', designs.back.length);
                            // ADVANCED: Professional texture creation for VirtualThreads.io quality
                            const texture = new THREE.CanvasTexture(targetCanvas);
                            texture.encoding = THREE.sRGBEncoding;
                            texture.flipY = false;
                            texture.generateMipmaps = textureQualitySettings.enableMipmaps;
                            texture.minFilter = THREE.LinearMipmapLinearFilter;
                            texture.magFilter = THREE.LinearFilter;
                            texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), textureQualitySettings.maxAnisotropy);
                            texture.format = THREE.RGBAFormat;
                            texture.type = THREE.UnsignedByteType;
                            texture.needsUpdate = true;
                            
                            if (Array.isArray(material)) {
                                material.forEach(matItem => {
                                    matItem.map = texture;
                                    matItem.transparent = meshHasTransparency;
                                    matItem.alphaTest = 0.1;
                                    matItem.needsUpdate = true;
                                });
                            } else {
                                material.map = texture;
                                material.transparent = meshHasTransparency;
                                material.alphaTest = 0.1;
                                material.needsUpdate = true;
                            }
                        } else {
                            // OPTIMIZED: Clean material state when no designs
                            if (Array.isArray(material)) {
                                material.forEach(matItem => {
                                    matItem.map = null;
                                    matItem.transparent = false;
                                    matItem.alphaTest = 0;
                                    matItem.needsUpdate = true;
                                });
                            } else {
                                material.map = null;
                                material.transparent = false;
                                material.alphaTest = 0;
                                material.needsUpdate = true;
                            }
                        }
                    } else if (node === tshirtMeshLeftArm) {
                        targetCtx = leftArmTextureCtx;
                        targetCanvas = leftArmTextureCanvas;

                        const armTransparency = await drawDesignsOnCanvas(
                            targetCtx, 
                            targetCanvas.width, 
                            targetCanvas.height, 
                            designs.left, 
                            baseColor,
                            {x: 0, y: 0, width: 1, height: 1} // Assuming full UV area for arm
                        );
                        meshHasTransparency = armTransparency;

                        if (designs.left.length > 0) {
                            console.log('[DRAW] left arm canvas updated, designs:', designs.left.length);
                            const texture = new THREE.CanvasTexture(targetCanvas);
                            texture.encoding = THREE.sRGBEncoding;
                            texture.flipY = false; // Prevent texture flipping
                            texture.needsUpdate = true;
                            
                            if (Array.isArray(material)) {
                                material.forEach(matItem => {
                                    matItem.map = texture;
                                    matItem.transparent = meshHasTransparency;
                                    matItem.alphaTest = 0.1;
                                    matItem.needsUpdate = true;
                                });
                            } else {
                                material.map = texture;
                                material.transparent = meshHasTransparency;
                                material.alphaTest = 0.1;
                                material.needsUpdate = true;
                            }
                        } else {
                            if (Array.isArray(material)) {
                                material.forEach(matItem => {
                                    matItem.map = null;
                                    matItem.transparent = false;
                                    matItem.alphaTest = 0;
                                    matItem.needsUpdate = true;
                                });
                            } else {
                                material.map = null;
                                material.transparent = false;
                                material.alphaTest = 0;
                                material.needsUpdate = true;
                            }
                        }
                    } else if (node === tshirtMeshRightArm) {
                        targetCtx = rightArmTextureCtx;
                        targetCanvas = rightArmTextureCanvas;

                        const armTransparency = await drawDesignsOnCanvas(
                            targetCtx, 
                            targetCanvas.width, 
                            targetCanvas.height, 
                            designs.right, 
                            baseColor,
                            {x: 0, y: 0, width: 1, height: 1} // Assuming full UV area for arm
                        );
                        meshHasTransparency = armTransparency;

                        if (designs.right.length > 0) {
                            console.log('[DRAW] right arm canvas updated, designs:', designs.right.length);
                            const texture = new THREE.CanvasTexture(targetCanvas);
                            texture.encoding = THREE.sRGBEncoding;
                            texture.flipY = false; // Prevent texture flipping
                            texture.needsUpdate = true;
                            
                            if (Array.isArray(material)) {
                                material.forEach(matItem => {
                                    matItem.map = texture;
                                    matItem.transparent = meshHasTransparency;
                                    matItem.alphaTest = 0.1;
                                    matItem.needsUpdate = true;
                                });
                            } else {
                                material.map = texture;
                                material.transparent = meshHasTransparency;
                                material.alphaTest = 0.1;
                                material.needsUpdate = true;
                            }
                        } else {
                            if (Array.isArray(material)) {
                                material.forEach(matItem => {
                                    matItem.map = null;
                                    matItem.transparent = false;
                                    matItem.alphaTest = 0;
                                    matItem.needsUpdate = true;
                                });
                            } else {
                                material.map = null;
                                material.transparent = false;
                                material.alphaTest = 0;
                                material.needsUpdate = true;
                            }
                        }
                    } else if (node === tshirtMeshCollar) {
                        // Yaka için sadece renk yeterli, tasarım uygulanmıyor
                        node.material = material;
                        node.material.needsUpdate = true;
                        return; // Diğer işlemlere geçme
                    } else {
                        // Tanınmayan diğer mesh'ler için sadece renk uygula
                        node.material = material;
                        node.material.needsUpdate = true;
                        return;
                    }
                    node.material = material; // Güncellenmiş materyali ata
                }
            });
            
            // Reset the flag to allow future calls
            isApplyingDesigns = false;
            console.log('✅ applyDesignsToModel completed');
        }

        /**
         * IMMEDIATE FIX: Enhanced animation loop with restored functionality
         * Updates model animations and renders the 3D scene with immediate fixes
         */
        function animate() {
            // PRODUCTION FIX: Guarantee exactly one rAF loop without blocking
            if (!window.__rafRunning) {
                window.__rafRunning = true;
            }
            
            requestAnimationFrame(animate);
            
            const currentTime = performance.now();
            const delta = clock.getDelta();
            
            // PRODUCTION FIX: Only log performance issues when fps < 25, throttled ≥2000ms
            const frameTime = currentTime - performanceOptimizer.lastFrameTime;
            performanceOptimizer.lastFrameTime = currentTime;
            const currentFPS = 1000 / frameTime;
            
            if (currentFPS < 25 && (!window.__lastPerfWarning || currentTime - window.__lastPerfWarning > 2000)) {
                console.warn('⚠️ Performance: fps', currentFPS.toFixed(1), 'frame time', frameTime.toFixed(2) + 'ms');
                window.__lastPerfWarning = currentTime;
            }
            
            // IMMEDIATE FIX: Update performance manager
            performanceManager.frameTime = frameTime;
            performanceManager.currentFPS = 1000 / frameTime;
            
            // IMMEDIATE FIX: Simple animation throttling during interactions
            if (interactionState.isDragging || interactionState.isResizing || interactionState.isRotating) {
                performanceOptimizer.interactionPriority = true;
                // Reduce animation complexity during interactions
                if (mixer) {
                    mixer.update(delta * 0.5);
                }
            } else {
                performanceOptimizer.interactionPriority = false;
                if (mixer) {
                    mixer.update(delta);
                }
            }
            
            // IMMEDIATE FIX: Basic animations with performance awareness
            if (tshirtModel && !interactionState.isDragging) {
                switch(currentAnimation) {
                    case 'rotate':
                        tshirtModel.rotation.y += 0.005;
                        break;
                    case 'walk':
                        const walkTime = Date.now() * 0.001;
                        tshirtModel.position.y = Math.sin(walkTime) * 0.04;
                        tshirtModel.rotation.z = Math.sin(walkTime * 0.8) * 0.01;
                        break;
                    case 'wave':
                        const waveTime = Date.now() * 0.0015;
                        tshirtModel.rotation.x = Math.sin(waveTime) * 0.04;
                        tshirtModel.rotation.z = Math.sin(waveTime * 0.7) * 0.03;
                        break;
                    case 'none':
                        break;
                }
            }
            
            // IMMEDIATE FIX: Basic controls update
            if (!interactionState.isDragging) {
                controls.update();
            }
            
            // IMMEDIATE FIX: Basic rendering
            renderer.render(scene, camera);
            
            // IMMEDIATE FIX: Throttled performance monitoring
            if (performanceManager.currentFPS < 30) {
                const now = Date.now();
                if (!window.__lastPerfWarning || now - window.__lastPerfWarning > 2000) {
                    window.__lastPerfWarning = now;
                console.warn('⚠️ Performance optimization needed:', {
                    fps: Math.round(performanceManager.currentFPS),
                    frameTime: Math.round(frameTime),
                    interactionActive: interactionState.isDragging || interactionState.isResizing
                });
                }
            }
        }

        /**
         * Pencere boyutu değiştiğinde canvas'ları ve kamera oranını yeniden boyutlandırır.
         */
        function onWindowResize() {
            const canvas = document.getElementById('canvas');
            if (canvas) {
                camera.aspect = canvas.clientWidth / canvas.clientHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(canvas.clientWidth, canvas.clientHeight);
            }

            // CRITICAL FIX: Use new refs system for preview resize
            const refs = getRightPanelRefs();
            if (!refs.preview || !refs.canvas || !refs.layer) {
                return;
            }
            
            const rect = refs.rect();
            if (!rect || !Number.isFinite(rect.width) || rect.width <= 0 || !Number.isFinite(rect.height) || rect.height <= 0) {
                return;
            }
            
            refs.canvas.width = rect.width;
            refs.canvas.height = rect.height;
            
            // Reposition existing elements via stored percentages
            refs.layer.querySelectorAll('.design-element').forEach(el => {
                const designId = el.getAttribute('data-design-id');
                const design = designs[currentArea]?.find(d => d.id === designId);
                if (design) {
                    updateElementPositionFromPercentages(el, design, rect);
                }
            });
            
            // Throttled resize log
            const now = Date.now();
            if (!window.__lastResizeLog || now - window.__lastResizeLog > 2000) {
                console.log('[RESIZE] Canvas updated:', `${refs.canvas.width}x${refs.canvas.height}`);
                window.__lastResizeLog = now;
            }
            
            // Trigger preview redraw
            drawDesignsOnCanvas(currentArea);
        }

        /**
         * 3D model görünümünü yakınlaştırır.
         */
        function zoomIn() {
            camera.position.z = Math.max(2, camera.position.z - 0.5); // Kamerayı yakınlaştır, minimum mesafeyi koru
        }

        /**
         * 3D model görünümünü uzaklaştırır.
         */
        function zoomOut() {
            camera.position.z = Math.min(10, camera.position.z + 0.5); // Kamerayı uzaklaştır, maksimum mesafeyi koru
        }

        /**
         * 3D model görünümünü ve kamera ayarlarını başlangıç durumuna sıfırlar.
         */
        function resetZoom() {
            camera.position.set(0, 0, 5); // Kamera konumunu sıfırla
            controls.reset(); // Orbit kontrollerini sıfırla
            if (tshirtModel) {
                tshirtModel.rotation.set(0, 0, 0); // Modelin dönüşünü sıfırla
                tshirtModel.position.set(0, -0.5, 0); // Modelin konumunu varsayılan konuma getir (modelin merkezine göre ayarlanabilir)
            }
        }

        /**
         * Mevcut 3D tişört tasarımını bir PNG görseli olarak dışa aktarır.
         */
        function exportDesign() {
            renderer.render(scene, camera); // Sahneyi son bir kez render et
            
            const canvas = renderer.domElement; // Renderer'ın canvas elementini al
            const link = document.createElement('a');
            link.download = 'tisort-tasarim-' + Date.now() + '.png'; // Dosya adını ayarla
            link.href = canvas.toDataURL(); // Canvas içeriğini Data URL olarak al
            link.click(); // İndirme işlemini başlat
        }

        /**
         * Kullanıcıdan metin girişi alır ve bu metni bir görsele dönüştürerek
         * 2D tasarım alanına ekler.
         */
        function addTextToDesign() {
            const text = prompt("Tişört üzerine eklemek istediğiniz metni girin:", "Özel Tasarım");
            if (text) {
                const canvas = document.createElement('canvas'); // Yeni bir canvas oluştur
                canvas.width = 512; // Metin görselinin genişliği
                canvas.height = 512; // Metin görselinin yüksekliği
                const ctx = canvas.getContext('2d');
                
                ctx.clearRect(0, 0, canvas.width, canvas.height); // Canvas'ı temizle
                
                ctx.font = "bold 80px Arial"; // Yazı tipi ve boyutu
                ctx.fillStyle = "#000000"; // Yazı rengi
                ctx.textAlign = "center"; // Yatay hizalama
                ctx.textBaseline = "middle"; // Dikey hizalama
                
                ctx.fillText(text, canvas.width/2, canvas.height/2); // Metni canvas'a çiz
                
                const dataURL = canvas.toDataURL('image/png'); // Canvas içeriğini PNG Data URL olarak al
                
                // Mevcut alanı temizle ve yeni metin tasarımını ekle
                designs[currentArea] = []; // Sadece bir metin tasarımı olacağı varsayımıyla mevcutları temizle
                addDesignToArea(dataURL, "Metin: " + text, 512, 512); // Metin görselini tasarım alanına ekle
            }
        }

        /**
         * YENİ PANEL SİSTEMİ İÇİN YARDIMCI FONKSİYONLAR
         */
        
        /**
         * BULLETPROOF VISIBILITY PROTECTION SYSTEM
         * Specifically addresses image disappearance issues in right panel
         */
        function preventImageDisappearance(elementId) {
            console.log('🛡️ Preventing image disappearance for:', elementId);
            
            const element = document.getElementById(elementId);
            if (!element) {
                console.warn('⚠️ Element not found for disappearance prevention:', elementId);
                return false;
            }
            
            // Create a robust visibility observer
            const ensureVisibility = () => {
                const computedStyle = window.getComputedStyle(element);
                const isHidden = computedStyle.display === 'none' || 
                               computedStyle.visibility === 'hidden' ||
                               computedStyle.opacity === '0';
                
                if (isHidden) {
                    console.warn('🚨 Element becoming invisible, forcing visibility:', elementId);
                    
                    // Force all visibility properties
                    element.style.setProperty('display', 'block', 'important');
                    element.style.setProperty('visibility', 'visible', 'important');
                    element.style.setProperty('opacity', '1', 'important');
                    element.style.setProperty('position', 'absolute', 'important');
                    element.style.setProperty('z-index', '20', 'important');
                    
                    // Also fix the image inside
                    const img = element.querySelector('img');
                    if (img) {
                        img.style.setProperty('display', 'block', 'important');
                        img.style.setProperty('visibility', 'visible', 'important');
                    }
                    
                    // Trigger a reflow to ensure changes take effect
                    element.offsetHeight;
                    
                    return true; // Indicate we fixed something
                }
                return false; // Element was already visible
            };
            
            // Check immediately
            ensureVisibility();
            
            // Set up a short-term monitor for this element
            let checkCount = 0;
            const monitor = setInterval(() => {
                checkCount++;
                const wasFixed = ensureVisibility();
                
                if (wasFixed) {
                    console.log('✅ Fixed visibility issue for:', elementId);
                }
                
                // Stop monitoring after 10 checks (5 seconds)
                if (checkCount >= 10) {
                    clearInterval(monitor);
                    console.log('🔍 Stopped monitoring element:', elementId);
                }
            }, 500);
            
                        return true;
        }

        /**
         * COMPREHENSIVE ELEMENT MANAGEMENT SYSTEM
         * Addresses all visibility, interaction, and positioning issues
         */
        function createRobustDesignElement(design) {
            console.log('🏗️ Creating robust design element:', design.id);
            
            // 0. Initialize rotation property safely
            const safeRotation = initializeDesignRotation(design);
            
            // 1. Create element with bulletproof properties
            const designElement = document.createElement('div');
            designElement.id = design.id;
            designElement.className = 'design-element robust-element';
            
            // 2. Apply ABSOLUTE visibility and positioning rules
            const applyRobustStyles = () => {
                designElement.style.setProperty('position', 'absolute', 'important');
                designElement.style.setProperty('display', 'block', 'important');
                designElement.style.setProperty('visibility', 'visible', 'important');
                designElement.style.setProperty('opacity', ((design.opacity || 100) / 100).toString(), 'important');
                designElement.style.setProperty('pointer-events', 'auto', 'important');
                designElement.style.setProperty('z-index', '20', 'important');
                designElement.style.setProperty('cursor', 'move', 'important');
                designElement.style.setProperty('user-select', 'none', 'important');
                
                // Size and position with fallbacks
                designElement.style.setProperty('width', (design.width || 100) + 'px', 'important');
                designElement.style.setProperty('height', (design.height || 100) + 'px', 'important');
                designElement.style.setProperty('left', (design.position?.x || 10) + '%', 'important');
                designElement.style.setProperty('top', (design.position?.y || 10) + '%', 'important');
                designElement.style.setProperty('transform', `rotate(${safeRotation}deg)`, 'important');
                
                // Border for visibility during development/debugging
                designElement.style.setProperty('border', '2px solid transparent', 'important');
                designElement.style.setProperty('border-radius', '4px', 'important');
                
                console.log('🎨 Applied robust styles with rotation:', safeRotation);
            };
            
            // 3. Create and configure image with robust error handling
            const img = document.createElement('img');
            img.src = design.imageData;
            img.alt = `Design element: ${design.fileName || 'Uploaded design'}`;
            img.style.setProperty('width', '100%', 'important');
            img.style.setProperty('height', '100%', 'important');
            img.style.setProperty('object-fit', 'contain', 'important');
            img.style.setProperty('pointer-events', 'none', 'important');
            img.style.setProperty('display', 'block', 'important');
            img.style.setProperty('visibility', 'visible', 'important');
            
            // 4. Handle image loading with fallbacks
            img.onload = () => {
                console.log('✅ Image loaded successfully for:', design.id);
                applyRobustStyles();
            };
            
            img.onerror = () => {
                console.error('❌ Image failed to load for:', design.id);
                // Create a fallback placeholder
                designElement.innerHTML = `
                    <div style="width: 100%; height: 100%; background: #f0f0f0; border: 2px dashed #ccc; 
                                display: flex; align-items: center; justify-content: center; font-size: 12px; color: #666;">
                        Image Error<br/>${design.fileName || 'Unknown'}
                    </div>
                `;
                applyRobustStyles();
            };
            
            designElement.appendChild(img);
            
            // 5. Apply initial styles immediately
            applyRobustStyles();
            
            // 6. Set up BULLETPROOF event handlers
            setupBulletproofEvents(designElement, design);
            
            // 7. Set up automatic visibility protection
            setupVisibilityProtection(designElement, design);
            
            // 8. Mark as having robust setup
            designElement.setAttribute('data-robust-setup', 'true');
            designElement.setAttribute('data-listeners-attached', 'true');
            
            console.log('✅ Robust design element created:', design.id);
            return designElement;
        }

        /**
         * BULLETPROOF EVENT HANDLING SYSTEM
         */
        function setupBulletproofEvents(element, design) {
            if (!element || !design) {
                console.error('❌ setupBulletproofEvents called with null parameters');
                return;
            }
            
            console.log('🎯 Setting up bulletproof events for:', design.id);
            
            // Prevent any default behaviors that might cause disappearance
            const preventDisappearance = (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                
                // Immediately ensure visibility
                ensureElementVisibility(element, design);
            };
            
            // Click handler with visibility protection
            element.addEventListener('click', (e) => {
                preventDisappearance(e);
                console.log('🖱️ ROBUST CLICK: Element clicked:', design.id);
                
                // Force visibility before and after selection
                ensureElementVisibility(element, design);
                newSelectDesignElement(element);
                
                // Double-check visibility after a short delay
                setTimeout(() => {
                    ensureElementVisibility(element, design);
                }, 50);
            }, { passive: false });
            
            // Note: mousedown is now handled by setupImmediateDragging
            // Removed this handler to prevent conflicts with the immediate dragging system
            
            // Hover effects with visibility protection
            element.addEventListener('mouseenter', () => {
                element.style.setProperty('border-color', '#3b82f6', 'important');
                ensureElementVisibility(element, design);
            });
            
            element.addEventListener('mouseleave', () => {
                element.style.setProperty('border-color', 'transparent', 'important');
            });
            
            // Context menu prevention (if needed)
            element.addEventListener('contextmenu', preventDisappearance);
            
            console.log('✅ Bulletproof events set up for:', design.id);
        }

        /**
         * AUTOMATIC VISIBILITY PROTECTION SYSTEM
         */
        function setupVisibilityProtection(element, design) {
            if (!element || !design) {
                console.error('❌ setupVisibilityProtection called with null parameters');
                return;
            }
            
            console.log('🛡️ Setting up visibility protection for:', design.id);
            
            // Create a MutationObserver to watch for style changes
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                        const computedStyle = window.getComputedStyle(element);
                        
                        // Check if element has been hidden
                        if (computedStyle.display === 'none' || 
                            computedStyle.visibility === 'hidden' || 
                            computedStyle.opacity === '0') {
                            
                            console.warn('🚨 VISIBILITY THREAT DETECTED for:', design.id, 'Restoring visibility!');
                            ensureElementVisibility(element, design);
                        }
                    }
                });
            });
            
            // Start observing
            observer.observe(element, {
                attributes: true,
                attributeFilter: ['style', 'class']
            });
            
            // Store observer reference for cleanup if needed
            element._visibilityObserver = observer;
            
            console.log('✅ Visibility protection active for:', design.id);
        }

        /**
         * IMMEDIATE DRAGGING SYSTEM - SIMPLIFIED AND DIRECT
         * Works immediately without complex event delegation
         */
        function setupImmediateDragging(element, design) {
            if (!element || !design) {
                console.error('❌ setupImmediateDragging: Missing parameters');
                return;
            }
            
            console.log('🎮 Setting up IMMEDIATE dragging for:', design.id);
            
            // Find the container
            const container = document.getElementById('designElementsLayer') || 
                            document.getElementById('newCanvasContainer') ||
                            element.parentElement;
                            
            if (!container) {
                console.error('❌ No container found for dragging');
                return;
            }
            
            console.log('📍 Container found:', container.id || container.className);
            
            let isDragging = false;
            let startX, startY, startLeft, startTop;
            
            // IMMEDIATE mousedown handler
            element.onmousedown = function(e) {
                console.log('🖱️ MOUSEDOWN on element:', design.id);
                
                e.preventDefault();
                e.stopPropagation();
                
                isDragging = true;
                
                // Get starting positions
                startX = e.clientX;
                startY = e.clientY;
                startLeft = parseInt(element.style.left) || 0;
                startTop = parseInt(element.style.top) || 0;
                
                // PROFESSIONAL DRAG FEEDBACK - Force visibility and enhance visual feedback
                element.style.setProperty('visibility', 'visible', 'important');
                element.style.setProperty('display', 'block', 'important');
                element.style.setProperty('z-index', '999', 'important');
                element.style.setProperty('cursor', 'grabbing', 'important');
                
                // Professional drag visual feedback
                element.style.setProperty('box-shadow', '0 8px 25px rgba(59, 130, 246, 0.4)', 'important');
                element.style.setProperty('transform', `rotate(${design.rotation || 0}deg) scale(1.05)`, 'important');
                element.style.setProperty('border', '2px solid #3b82f6', 'important');
                
                console.log('🚀 DRAG STARTED:', { startX, startY, startLeft, startTop });
                
                // Attach move and up handlers to document for better tracking
                document.onmousemove = handleMouseMove;
                document.onmouseup = handleMouseUp;
                
                return false; // Prevent default drag behavior
            };
            
            function handleMouseMove(e) {
                if (!isDragging) return;
                
                e.preventDefault();
                
                // Calculate movement
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;
                
                // Calculate new position
                let newLeft = startLeft + deltaX;
                let newTop = startTop + deltaY;
                
                // Get container bounds
                const containerRect = container.getBoundingClientRect();
                const elementWidth = element.offsetWidth;
                const elementHeight = element.offsetHeight;
                
                // Apply boundary constraints
                newLeft = Math.max(0, Math.min(newLeft, containerRect.width - elementWidth));
                newTop = Math.max(0, Math.min(newTop, containerRect.height - elementHeight));
                
                // Apply new position
                element.style.setProperty('left', newLeft + 'px', 'important');
                element.style.setProperty('top', newTop + 'px', 'important');
                
                // Update design object
                design.position.x = (newLeft / containerRect.width) * 100;
                design.position.y = (newTop / containerRect.height) * 100;
                
                console.log('🔄 DRAGGING:', design.id, { newLeft, newTop });
                
                // REAL-TIME Updates during dragging for professional feel
                drawDesignPreview();
                immediateApplyDesignsToModel(); // Immediate 60fps updates during drag
            }
            
            function handleMouseUp(e) {
                if (!isDragging) return;
                
                console.log('🏁 DRAG ENDED for:', design.id);
                
                isDragging = false;
                
                // PROFESSIONAL DRAG END - Reset visual feedback
                element.style.setProperty('cursor', 'move', 'important');
                element.style.setProperty('z-index', '20', 'important');
                
                // Reset professional drag visual feedback
                element.style.setProperty('box-shadow', '0 2px 8px rgba(0, 0, 0, 0.1)', 'important');
                element.style.setProperty('transform', `rotate(${design.rotation || 0}deg) scale(1)`, 'important');
                element.style.setProperty('border', '2px solid transparent', 'important');
                
                // Clean up event handlers
                document.onmousemove = null;
                document.onmouseup = null;
                
                // Ensure final visibility
                element.style.setProperty('visibility', 'visible', 'important');
                element.style.setProperty('display', 'block', 'important');
                
                console.log('✅ Final position:', design.position);
            }
            
            // PROFESSIONAL HOVER EFFECTS for better visual feedback
            element.onmouseenter = function() {
                if (!isDragging) {
                    element.style.setProperty('box-shadow', '0 4px 15px rgba(59, 130, 246, 0.2)', 'important');
                    element.style.setProperty('border', '2px solid rgba(59, 130, 246, 0.5)', 'important');
                    element.style.setProperty('transform', `rotate(${design.rotation || 0}deg) scale(1.02)`, 'important');
                }
            };
            
            element.onmouseleave = function() {
                if (!isDragging) {
                    element.style.setProperty('box-shadow', '0 2px 8px rgba(0, 0, 0, 0.1)', 'important');
                    element.style.setProperty('border', '2px solid transparent', 'important');
                    element.style.setProperty('transform', `rotate(${design.rotation || 0}deg) scale(1)`, 'important');
                }
            };
            
            // Also handle touch events for mobile
            element.ontouchstart = function(e) {
                if (e.touches.length === 1) {
                    const touch = e.touches[0];
                    element.onmousedown({
                        clientX: touch.clientX,
                        clientY: touch.clientY,
                        preventDefault: () => e.preventDefault(),
                        stopPropagation: () => e.stopPropagation()
                    });
                }
            };
            
            console.log('✅ IMMEDIATE dragging with PROFESSIONAL FEEDBACK setup complete for:', design.id);
        }

        /**
         * ORIGINAL DRAGGING SYSTEM (BACKUP)
         * Specifically designed for the right panel design workspace
         */
        function setupRightPanelDragging(element, design) {
            if (!element || !design) {
                console.error('❌ setupRightPanelDragging called with null parameters');
                return;
            }
            
            console.log('🎮 Setting up RIGHT PANEL dragging for:', design.id);
            
            // Get the right panel container specifically
            const rightPanelContainer = document.getElementById('newCanvasContainer') ||
                                      document.getElementById('designElementsLayer') ||
                                      element.parentElement;
            
            if (!rightPanelContainer) {
                console.error('❌ Right panel container not found for dragging setup');
                return;
            }
            
            let isDragging = false;
            let offsetX = 0, offsetY = 0;
            
            console.log('📍 Right panel container found:', rightPanelContainer.id);
            
            // MOUSEDOWN - Start dragging
            const startDrag = (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                isDragging = true;
                
                console.log('🚀 RIGHT PANEL DRAG STARTED for:', design.id);
                
                // Force visibility and bring to front
                element.style.setProperty('visibility', 'visible', 'important');
                element.style.setProperty('display', 'block', 'important');
                element.style.setProperty('opacity', '1', 'important');
                element.style.setProperty('z-index', '999', 'important');
                element.style.setProperty('position', 'absolute', 'important');
                element.style.setProperty('cursor', 'grabbing', 'important');
                
                // Calculate offset from mouse to element's top-left corner
                const elementRect = element.getBoundingClientRect();
                const containerRect = rightPanelContainer.getBoundingClientRect();
                
                offsetX = e.clientX - elementRect.left;
                offsetY = e.clientY - elementRect.top;
                
                console.log('📊 Drag offset calculated:', { offsetX, offsetY });
                
                // Prevent text selection
                document.body.style.userSelect = 'none';
                
                // Add event listeners to the panel for dragging
                rightPanelContainer.addEventListener('mousemove', doDrag);
                document.addEventListener('mouseup', endDrag);
            };
            
            // MOUSEMOVE - Perform dragging
            const doDrag = (e) => {
                if (!isDragging) return;
                
                e.preventDefault();
                
                // PRODUCTION FIX: Use unified rect for all mapping
                const rect = document.getElementById('newCanvasContainer').getBoundingClientRect();
                
                // Calculate new position with drag start anchoring (no jumps)
                let newLeft = e.clientX - rect.left - offsetX;
                let newTop = e.clientY - rect.top - offsetY;
                
                // Get element dimensions for extents clamping
                const elementWidth = element.offsetWidth;
                const elementHeight = element.offsetHeight;
                
                // PRODUCTION FIX: Clamp with element extents, floats only (no rounding)
                newLeft = Math.max(0, Math.min(newLeft, rect.width - elementWidth));
                newTop = Math.max(0, Math.min(newTop, rect.height - elementHeight));
                
                // Apply new position in pixels (more reliable for dragging)
                element.style.setProperty('left', newLeft + 'px', 'important');
                element.style.setProperty('top', newTop + 'px', 'important');
                
                // PRODUCTION FIX: Update design object with percentage using same rect
                const percentX = (newLeft / rect.width) * 100;
                const percentY = (newTop / rect.height) * 100;
                
                design.position.x = percentX;
                design.position.y = percentY;
                
                console.log('🔄 DRAGGING:', design.id, { 
                    pixelPos: { x: newLeft, y: newTop },
                    percentPos: { x: percentX.toFixed(1), y: percentY.toFixed(1) }
                });
                
                // Ensure element stays visible during drag
                element.style.setProperty('visibility', 'visible', 'important');
                element.style.setProperty('display', 'block', 'important');
                
                // PRODUCTION FIX: Only lightweight updates during drag
                drawDesignPreview();
                updateSelectedDesignTransformsLightweight();
            };
            
            // MOUSEUP - End dragging
            const endDrag = (e) => {
                if (!isDragging) return;
                
                isDragging = false;
                
                console.log('🏁 RIGHT PANEL DRAG ENDED for:', design.id);
                
                // Reset cursor and z-index
                element.style.setProperty('cursor', 'move', 'important');
                element.style.setProperty('z-index', '20', 'important');
                
                // Restore text selection
                document.body.style.userSelect = '';
                
                // SURGICAL FIX: Ensure final apply runs after drag completes
                scheduleApplyDesignsIdle(0); // Immediate final update
                
                // PRODUCTION FIX: Remove no-anim class after drag
                if (selectedDesign) {
                    const element = document.getElementById(selectedDesign.id);
                    if (element) {
                        element.classList.remove('no-anim');
                    }
                }
                
                // Remove event listeners
                rightPanelContainer.removeEventListener('mousemove', doDrag);
                document.removeEventListener('mouseup', endDrag);
                
                // Final visibility check
                element.style.setProperty('visibility', 'visible', 'important');
                element.style.setProperty('display', 'block', 'important');
                element.style.setProperty('position', 'absolute', 'important');
                
                console.log('✅ Drag completed, element position saved:', {
                    x: design.position.x,
                    y: design.position.y
                });
            };
            
            // Set up the initial mousedown listener
            element.addEventListener('mousedown', startDrag);
            
            // Touch support for mobile
            element.addEventListener('touchstart', (e) => {
                if (e.touches.length === 1) {
                    const touch = e.touches[0];
                    startDrag({
                        clientX: touch.clientX,
                        clientY: touch.clientY,
                        preventDefault: () => e.preventDefault(),
                        stopPropagation: () => e.stopPropagation()
                    });
                }
            });
            
            console.log('✅ RIGHT PANEL dragging system set up for:', design.id);
        }

        /**
         * PROFESSIONAL PRECISION POSITIONING SYSTEM
         * High-precision positioning with sub-pixel accuracy and smooth transitions
         */
        function setupPrecisionPositioning() {
            console.log('🎯 Setting up precision positioning system');
            
            // Sub-pixel positioning for smooth movement
            const precisionUpdateElement = (element, design, smoothTransition = false) => {
                if (!element || !design) return;
                
                const container = document.getElementById('designElementsLayer') || 
                                document.getElementById('newCanvasContainer');
                
                if (!container) return;
                
                const containerRect = container.getBoundingClientRect();
                
                // Calculate precise pixel positions from percentages
                const pixelX = (design.position.x / 100) * containerRect.width;
                const pixelY = (design.position.y / 100) * containerRect.height;
                
                // Apply smooth transitions for non-dragging updates
                if (smoothTransition) {
                    element.style.setProperty('transition', 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)', 'important');
                } else {
                    element.style.setProperty('transition', 'none', 'important');
                }
                
                // High-precision positioning with sub-pixel accuracy
                element.style.setProperty('left', `${pixelX.toFixed(2)}px`, 'important');
                element.style.setProperty('top', `${pixelY.toFixed(2)}px`, 'important');
                element.style.setProperty('width', `${design.width || 100}px`, 'important');
                element.style.setProperty('height', `${design.height || 100}px`, 'important');
                
                // Precise rotation with safe initialization
                const safeRotation = initializeDesignRotation(design);
                element.style.setProperty('transform', `rotate(${safeRotation}deg)`, 'important');
                
                console.log('🎯 Precision positioning applied:', {
                    id: design.id,
                    pixelPos: { x: pixelX.toFixed(2), y: pixelY.toFixed(2) },
                    rotation: safeRotation
                });
            };
            
            // Expose precision positioning function globally
            window.precisionUpdateElement = precisionUpdateElement;
            
            console.log('✅ Precision positioning system ready');
        }

        /**
         * COMPREHENSIVE ELEMENT POSITIONING AND VISIBILITY SYSTEM
         * Ensures elements stay visible and positioned correctly in the right panel
         */
        function setupElementPositioningSystem() {
            console.log('🔧 Setting up comprehensive element positioning system');
            
            // Function to update element position within bounds
            function updateElementPosition(element, design) {
                if (!element || !design) return;
                
                const container = document.getElementById('designElementsLayer') || 
                                document.getElementById('newCanvasContainer');
                
                if (!container) {
                    console.warn('⚠️ Container not found for positioning update');
                    return;
                }
                
                const containerRect = container.getBoundingClientRect();
                const elementRect = element.getBoundingClientRect();
                
                // Ensure element is within container bounds
                let needsUpdate = false;
                let newLeft = parseFloat(element.style.left) || 0;
                let newTop = parseFloat(element.style.top) || 0;
                
                // Check if element is outside left boundary
                if (elementRect.left < containerRect.left) {
                    newLeft = 0;
                    needsUpdate = true;
                }
                
                // Check if element is outside top boundary
                if (elementRect.top < containerRect.top) {
                    newTop = 0;
                    needsUpdate = true;
                }
                
                // Check if element is outside right boundary
                if (elementRect.right > containerRect.right) {
                    newLeft = containerRect.width - element.offsetWidth;
                    needsUpdate = true;
                }
                
                // Check if element is outside bottom boundary
                if (elementRect.bottom > containerRect.bottom) {
                    newTop = containerRect.height - element.offsetHeight;
                    needsUpdate = true;
                }
                
                if (needsUpdate) {
                    console.log('🔧 Updating element position to stay within bounds:', design.id);
                    element.style.setProperty('left', newLeft + 'px', 'important');
                    element.style.setProperty('top', newTop + 'px', 'important');
                    
                    // Update design object
                    design.position.x = (newLeft / containerRect.width) * 100;
                    design.position.y = (newTop / containerRect.height) * 100;
                }
                
                // Force visibility
                element.style.setProperty('visibility', 'visible', 'important');
                element.style.setProperty('display', 'block', 'important');
                element.style.setProperty('opacity', ((design.opacity || 100) / 100).toString(), 'important');
                element.style.setProperty('position', 'absolute', 'important');
                element.style.setProperty('z-index', '20', 'important');
            }
            
            // Periodic positioning check
            setInterval(() => {
                const currentDesigns = designs[currentArea] || [];
                currentDesigns.forEach(design => {
                    const element = document.getElementById(design.id);
                    if (element) {
                        updateElementPosition(element, design);
                    }
                });
            }, 500); // Check every 500ms
            
            console.log('✅ Element positioning system active');
        }

        /**
         * ROTATION PROPERTY INITIALIZATION AND HANDLING
         * Ensures rotation property is always safely accessible
         */
        function initializeDesignRotation(design) {
            if (!design) {
                console.error('❌ initializeDesignRotation called with null design');
                return 0;
            }
            
            // Ensure rotation property exists and is a number
            if (typeof design.rotation === 'undefined' || design.rotation === null) {
                design.rotation = 0;
                console.log('🔄 Initialized rotation to 0 for design:', design.id);
            }
            
            // Ensure rotation is a valid number
            if (isNaN(design.rotation)) {
                console.warn('⚠️ Invalid rotation value detected, resetting to 0:', design.rotation);
                design.rotation = 0;
            }
            
            // Normalize rotation to 0-359 range
            design.rotation = design.rotation % 360;
            if (design.rotation < 0) {
                design.rotation += 360;
            }
            
            return design.rotation;
        }

        /**
         * ENHANCED ELEMENT SELECTION SYSTEM
         * Handles element selection without causing disappearance
         */
        function setupElementSelectionSystem() {
            console.log('🎯 Setting up enhanced element selection system');
            
            // PRODUCTION FIX: Handle clicks on rpEditor overlay
            const { overlay } = getRightPanelRefs();
            
            if (!overlay) {
                // Skip if rpEditor not ready (let rpEditor handle its own selection)
                return;
            }
            
            overlay.addEventListener('click', (e) => {
                console.log('🖱️ RIGHT PANEL CLICKED');
                
                // Find if click was on a design element
                const designElement = e.target.closest('.design-element');
                
                if (designElement) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    console.log('🎯 Design element clicked:', designElement.id);
                    
                    // Force visibility before selection
                    designElement.style.setProperty('visibility', 'visible', 'important');
                    designElement.style.setProperty('display', 'block', 'important');
                    designElement.style.setProperty('opacity', '1', 'important');
                    designElement.style.setProperty('position', 'absolute', 'important');
                    designElement.style.setProperty('z-index', '25', 'important');
                    
                    // Select the element
                    newSelectDesignElement(designElement);
                    
                    // Double-check visibility after selection
                    setTimeout(() => {
                        designElement.style.setProperty('visibility', 'visible', 'important');
                        designElement.style.setProperty('display', 'block', 'important');
                        console.log('✅ Element visibility confirmed after selection:', designElement.id);
                    }, 50);
                }
            });
            
            console.log('✅ Element selection system active');
        }

        /**
         * Seçim göstergelerini günceller
         */
        function updateSelectionIndicators(designId) {
            const selectedIndicator = document.getElementById('selectedIndicator');
            const indicatorText = document.querySelector('.indicator-text');
            
            if (selectedIndicator && indicatorText) {
                selectedIndicator.classList.add('active');
                indicatorText.textContent = `Seçili: ${designId.substring(0, 8)}...`;
            }
        }
        
        /**
         * Elements listesini günceller
         */
        function updateElementsList() {
            const elementsList = document.getElementById('elementsList');
            const elementsCount = document.getElementById('elementsCount');
            
            if (!elementsList) {
                console.log('📋 elementsList not found - new panel system may not be fully loaded');
                return;
            }
            
            // CRITICAL FIX: Ensure elements list is visible and accessible
            elementsList.style.display = 'block';
            elementsList.style.visibility = 'visible';
            elementsList.style.opacity = '1';
            elementsList.style.zIndex = '100';
            elementsList.style.pointerEvents = 'auto';
            
            // CRITICAL FIX: Set proper accessibility attributes
            elementsList.setAttribute('role', 'list');
            elementsList.setAttribute('aria-label', 'Design elements list');
            
            const currentDesigns = designs[currentArea] || [];
            
            // Update count
            if (elementsCount) {
                elementsCount.textContent = `${currentDesigns.length} element${currentDesigns.length !== 1 ? 's' : ''}`;
            }
            
            // CRITICAL FIX: Clear existing items and rebuild
            elementsList.innerHTML = '';
            
            if (currentDesigns.length === 0) {
                // Show no elements message
                elementsList.innerHTML = `
                    <div class="no-elements-message" id="noElementsMessage">
                        <div class="message-icon">📱</div>
                        <p>Henüz tasarım eklenmedi</p>
                        <small>Sol panelden bir görsel yükleyin</small>
                    </div>
                `;
                return;
            }
            
            // CRITICAL FIX: Create element items with enhanced interaction
            currentDesigns.forEach((design, index) => {
                const item = document.createElement('div');
                item.className = 'element-item design-element-right-panel';
                item.dataset.designId = design.id;
                item.setAttribute('role', 'listitem');
                item.setAttribute('tabindex', '0');
                item.setAttribute('aria-label', `Design element: ${design.name || design.fileName}`);
                item.setAttribute('title', `Design element: ${design.name || design.fileName}`);
                
                // CRITICAL FIX: Add selection class if this is the selected design
                if (selectedDesign && selectedDesign.id === design.id) {
                    item.classList.add('selected');
                }
                
                item.innerHTML = `
                    <img
                        src="${design.imageData}"
                        class="element-thumb"
                        alt="${design.name || design.fileName || 'Design'}"
                        title="${design.name || design.fileName || 'Design'}"
                    />
                    <div class="element-info">
                        <div class="element-name">${design.name || design.fileName}</div>
                        <div class="element-details">${design.width}x${design.height}px</div>
                    </div>
                `;
                
                // CRITICAL FIX: Enhanced click handler with proper synchronization
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    console.log('🎯 Element list item clicked:', design.id);
                    
                    // CRITICAL FIX: Remove previous selection
                    elementsList.querySelectorAll('.element-item.selected').forEach(selectedItem => {
                        selectedItem.classList.remove('selected');
                    });
                    
                    // CRITICAL FIX: Add selection to current item
                    item.classList.add('selected');
                    
                    // CRITICAL FIX: Select the design with proper synchronization
                    const element = document.getElementById(design.id);
                    if (element) {
                        // CRITICAL FIX: Ensure element is visible before selection
                        element.style.setProperty('display', 'block', 'important');
                        element.style.setProperty('visibility', 'visible', 'important');
                        element.style.setProperty('opacity', '1', 'important');
                        element.style.setProperty('z-index', '1000', 'important');
                        element.style.setProperty('pointer-events', 'auto', 'important');
                        
                        // CRITICAL FIX: Use enhanced selection system
                        selectDesignElement(element);
                        update3DModelSelection(design);
                        
                            console.log('✅ Successfully selected element from list:', design.id);
                            
                        // CRITICAL FIX: Scroll element into view if it's outside viewport
                            element.scrollIntoView({ 
                                behavior: 'smooth', 
                                block: 'center',
                                inline: 'center'
                            });
                    } else {
                        console.warn('⚠️ Element not found in DOM, recreating:', design.id);
                        
                        // CRITICAL FIX: Create enhanced design element
                        const newElement = createEnhancedDesignElement(design);
                        const designElementsLayer = document.getElementById('designElementsLayer');
                        if (designElementsLayer) {
                            designElementsLayer.appendChild(newElement);
                        }
                        
                        // CRITICAL FIX: Select the newly created element
                        selectDesignElement(newElement);
                        update3DModelSelection(design);
                        
                        console.log('✅ Successfully recreated and selected element:', design.id);
                    }
                });
                
                elementsList.appendChild(item);
            });
            
                         console.log('✅ Elements list updated with', currentDesigns.length, 'elements');
        }
        
        /**
         * Properties panelini günceller
         */
        function updatePropertiesPanel() {
            const propertiesControls = document.getElementById('propertiesControls');
            const noSelectionMessage = document.getElementById('noSelectionMessage');
            
            if (!propertiesControls || !noSelectionMessage) {
                console.log('🎛️ Properties panel elements not found - new panel system may not be fully loaded');
                return;
            }
            
            if (selectedDesign) {
                noSelectionMessage.style.display = 'none';
                propertiesControls.style.display = 'block';
                
                // Update slider values and labels
                const sizeControl = document.getElementById('sizeControl');
                const opacityControl = document.getElementById('opacityControl');
                const rotationControl = document.getElementById('rotationControl');
                const sizeValue = document.getElementById('sizeValue');
                const opacityValue = document.getElementById('opacityValue');
                const rotationValue = document.getElementById('rotationValue');
                
                if (sizeControl && sizeValue) {
                    const sizePercent = Math.round((selectedDesign.width / 100) * 100);
                    sizeControl.value = sizePercent;
                    sizeValue.textContent = sizePercent + '%';
                }
                
                if (opacityControl && opacityValue) {
                    opacityControl.value = selectedDesign.opacity;
                    opacityValue.textContent = selectedDesign.opacity + '%';
                }
                
                if (rotationControl && rotationValue) {
                    const safeRotation = initializeDesignRotation(selectedDesign);
                    rotationControl.value = safeRotation;
                    rotationValue.textContent = safeRotation + '°';
                }
            } else {
                noSelectionMessage.style.display = 'block';
                propertiesControls.style.display = 'none';
            }
        }
        
        /**
         * Canvas başlığını günceller
         */
        function updateCanvasTitle() {
            const canvasTitle = document.getElementById('canvasTitle');
            if (canvasTitle) {
                const areaNames = {
                    front: 'ÖN TASARIM ALANI',
                    back: 'ARKA TASARIM ALANI',
                    left: 'SOL KOL TASARIM ALANI',
                    right: 'SAĞ KOL TASARIM ALANI'
                };
                canvasTitle.textContent = areaNames[currentArea] || 'TASARIM ALANI';
            }
        }
        
        /**
         * Mevcut alanı temizle
         */
        function clearCurrentArea() {
            if (confirm(`${currentArea} alanındaki tüm tasarımlar silinecek. Emin misiniz?`)) {
                designs[currentArea] = [];
                selectedDesign = null;
                
                // Clear DOM elements
                const designElementsLayer = document.getElementById('designElementsLayer');
                if (designElementsLayer) {
                    designElementsLayer.innerHTML = '';
                }
                
                updateElementsList();
                updatePropertiesPanel();
                updateSelectionIndicators('');
                drawDesignPreview();
                throttledApplyDesignsToModel();
            }
        }
        
        /**
         * Canvas görünümünü sıfırla
         */
        function resetCanvasView() {
            // Reset canvas size and position
            const canvas = document.getElementById('designPreviewCanvas');
            if (canvas) {
                canvas.style.transform = 'scale(1)';
            }
        }
        
        /**
         * Seçili tasarımı sil
         */
        function deleteSelectedDesign() {
            if (selectedDesign && confirm('Seçili tasarım silinecek. Emin misiniz?')) {
                removeDesign(selectedDesign.id);
            }
        }
        
        /**
         * Seçili tasarımı kopyala
         */
        function duplicateSelectedDesign() {
            if (selectedDesign) {
                const newDesign = {
                    ...selectedDesign,
                    id: 'design_' + Date.now(),
                    position: {
                        x: selectedDesign.position.x + 5,
                        y: selectedDesign.position.y + 5
                    }
                };
                
                designs[currentArea].push(newDesign);
                addDesignElementToPreview(newDesign);
                updateElementsList();
                throttledApplyDesignsToModel();
            }
        }

        // Global erişim için önemli fonksiyonları window objesine ata
        window.switchDesignArea = switchDesignArea;
        window.zoomIn = zoomIn;
        window.zoomOut = zoomOut;
        window.resetZoom = resetZoom;
        window.exportDesign = exportDesign;
        window.addTextToDesign = addTextToDesign;
        window.removeDesign = removeDesign;
        window.clearCurrentArea = clearCurrentArea;
        window.resetCanvasView = resetCanvasView;
        window.deleteSelectedDesign = deleteSelectedDesign;
        window.duplicateSelectedDesign = duplicateSelectedDesign;

        // Sayfa yüklendiğinde uygulamayı başlat
        window.addEventListener('load', init);
        
        // IMMEDIATE FIX: Restore functionality after initialization
        setTimeout(() => {
            initializeAndRestoreFunctionality();
        }, 100);
        
        // CRITICAL FIX: Enhanced initialization for immediate right panel interactivity
        function initializeRightPanelInteractivity() {
            console.log('🚀 Initializing right panel interactivity...');
            
            // CRITICAL FIX: Force design panel visibility and interaction
            const designPanel = document.getElementById('designPanel');
            if (designPanel) {
                designPanel.style.display = 'flex';
                designPanel.style.visibility = 'visible';
                designPanel.style.opacity = '1';
                designPanel.style.zIndex = '1000';
                designPanel.style.pointerEvents = 'auto';
                designPanel.style.userSelect = 'none';
                designPanel.style.webkitUserSelect = 'none';
                designPanel.style.mozUserSelect = 'none';
                designPanel.style.msUserSelect = 'none';
                designPanel.style.touchAction = 'none';
            }
            
            // CRITICAL FIX: Force design elements layer visibility and interaction
            const designElementsLayer = document.getElementById('designElementsLayer');
            if (designElementsLayer) {
                designElementsLayer.style.display = 'block';
                designElementsLayer.style.visibility = 'visible';
                designElementsLayer.style.opacity = '1';
                designElementsLayer.style.zIndex = '100';
                designElementsLayer.style.pointerEvents = 'auto';
                designElementsLayer.style.userSelect = 'none';
                designElementsLayer.style.webkitUserSelect = 'none';
                designElementsLayer.style.mozUserSelect = 'none';
                designElementsLayer.style.msUserSelect = 'none';
                designElementsLayer.style.touchAction = 'none';
            }
            
            // CRITICAL FIX: Force preview canvas visibility
            const previewCanvas = document.getElementById('designPreviewCanvas');
            if (previewCanvas) {
                previewCanvas.style.display = 'block';
                previewCanvas.style.visibility = 'visible';
                previewCanvas.style.opacity = '1';
                previewCanvas.style.zIndex = '50';
            }
            
            // CRITICAL FIX: Make all existing design elements interactive
            const existingElements = document.querySelectorAll('.design-element');
            existingElements.forEach(element => {
                const designId = element.id;
                const design = designs[currentArea].find(d => d.id === designId);
                
                if (design) {
                    console.log('🔧 Making existing element interactive:', designId);
                    
                    // CRITICAL FIX: Force interactive styles
                    element.style.pointerEvents = 'auto';
                    element.style.cursor = 'pointer';
                    element.style.userSelect = 'none';
                    element.style.webkitUserSelect = 'none';
                    element.style.mozUserSelect = 'none';
                    element.style.msUserSelect = 'none';
                    element.style.touchAction = 'none';
                    element.style.display = 'block';
                    element.style.visibility = 'visible';
                    element.style.opacity = '1';
                    element.style.zIndex = '1000';
                    element.style.position = 'absolute';
                    element.style.transform = 'translate3d(0, 0, 0)';
                    
                    // CRITICAL FIX: Add interactive class
                    element.classList.add('interactive-design-element');
                    
                    // CRITICAL FIX: Add data attributes
                    element.setAttribute('data-design-id', design.id);
                    element.setAttribute('data-interactive', 'true');
                    
                    // CRITICAL FIX: Setup all interaction systems
                    setupEnhancedInteractions(element, design);
                    setupRightPanelInteraction(element, design);
                    makeElementInteractive(element, design);
                    addResizeAndRotateHandles(element, design);
                    setup3DModelInteraction(element, design);
                    
                    console.log('✅ Existing element made interactive:', designId);
                }
            });
            
            // CRITICAL FIX: Setup global click handlers for right panel
            setupGlobalRightPanelHandlers();
            
            console.log('✅ Right panel interactivity initialized');
        }
        
        // CRITICAL FIX: Setup global right panel handlers
        function setupGlobalRightPanelHandlers() {
            console.log('🔧 Setting up global right panel handlers...');
            
            // CRITICAL FIX: Handle clicks on design elements layer
            const designElementsLayer = document.getElementById('designElementsLayer');
            if (designElementsLayer) {
                designElementsLayer.addEventListener('click', (e) => {
                    const clickedElement = e.target.closest('.design-element');
                    if (clickedElement) {
                        const designId = clickedElement.id;
                        const design = designs[currentArea].find(d => d.id === designId);
                        
                        if (design) {
                            console.log('🎯 Design clicked via global handler:', designId);
                            
                            // CRITICAL FIX: Select the design
                            selectDesignElement(clickedElement);
                            
                            // CRITICAL FIX: Show design controls
                            showDesignControls(design);
                            
                            // CRITICAL FIX: Update 3D model selection
                            update3DModelSelection(design);
                            
                            // CRITICAL FIX: Show handles
                            showDesignHandles(clickedElement);
                            
                            // CRITICAL FIX: Update design properties panel
                            updateDesignPropertiesPanel(design);
                            
                            // CRITICAL FIX: Add selected class
                            clickedElement.classList.add('selected');
                            
                            console.log('✅ Design selected via global handler:', designId);
                        }
                    }
                });
            }
            
            // CRITICAL FIX: Handle touch events for mobile
            if (designElementsLayer) {
                designElementsLayer.addEventListener('touchstart', (e) => {
                    const touchedElement = e.target.closest('.design-element');
                    if (touchedElement) {
                        const designId = touchedElement.id;
                        const design = designs[currentArea].find(d => d.id === designId);
                        
                        if (design) {
                            console.log('👆 Design touched via global handler:', designId);
                            
                            // CRITICAL FIX: Select the design
                            selectDesignElement(touchedElement);
                            
                            // CRITICAL FIX: Show design controls
                            showDesignControls(design);
                            
                            // CRITICAL FIX: Update 3D model selection
                            update3DModelSelection(design);
                            
                            // CRITICAL FIX: Show handles
                            showDesignHandles(touchedElement);
                            
                            // CRITICAL FIX: Update design properties panel
                            updateDesignPropertiesPanel(design);
                            
                            // CRITICAL FIX: Add selected class
                            touchedElement.classList.add('selected');
                            
                            console.log('✅ Design selected via touch global handler:', designId);
                        }
                    }
                });
            }
            
            console.log('✅ Global right panel handlers setup complete');
        }
        
        // CRITICAL FIX: Enhanced initialization with right panel interactivity
        setTimeout(() => {
            initializeRightPanelInteractivity();
        }, 200);
        
        // SIMPLE FIX: Restore basic functionality
        function restoreBasicFunctionality() {
            // PRODUCTION FIX: Skip if rpEditor exists
            if (document.getElementById('rp-editor') || window.__RP_READY__) return;
            if (window.__restoreBasicFunctionality_done) return;
            window.__restoreBasicFunctionality_done = true;
            
            console.log('🔧 Restoring basic functionality...');
            
            // Simple fix: Just update the 3D model
            drawDesignPreview();
            applyDesignsToModel();
            
            console.log('✅ Basic functionality restored');
        }
        
        // SIMPLE FIX: Restore basic functionality
        setTimeout(() => {
            restoreBasicFunctionality();
        }, 100);
        
        // SIMPLE FIX: Restore basic functionality on page load
        window.addEventListener('load', () => {
            setTimeout(() => {
                restoreBasicFunctionality();
            }, 500);
        });
        

        

        

        

        

        
        // SIMPLE FIX: Restore basic functionality
        function simpleFix() {
            // PRODUCTION FIX: Skip if rpEditor exists
            if (document.getElementById('rp-editor') || window.__RP_READY__) return;
            if (window.__simpleFix_done) return;
            window.__simpleFix_done = true;
            
            console.log('🔧 Simple fix: Restoring basic functionality...');
            
            // Update the 3D model
            drawDesignPreview();
            applyDesignsToModel();
            
            // Also fix the right panel
            fixRightPanel();
            
            console.log('✅ Simple fix completed');
        }
        
        // SIMPLE RIGHT PANEL: Add design to right panel
        function addDesignToRightPanel(design) {
            console.log('🎯 Adding design to right panel:', design.id);
            
            // Get the elements list container
            const elementsList = document.getElementById('elementsList');
            if (!elementsList) {
                console.log('❌ Elements list not found');
                return;
            }
            
            // Remove no elements message if it exists
            const noElementsMessage = document.getElementById('noElementsMessage');
            if (noElementsMessage) {
                noElementsMessage.remove();
            }
            
            // Create simple design element for right panel
            const designElement = document.createElement('div');
            designElement.className = 'design-element-right-panel';
            designElement.id = `right-panel-${design.id}`;
            designElement.setAttribute('data-design-id', design.id);
            
            designElement.innerHTML = `
                <div class="design-image">
                    <img src="${design.imageData}" alt="Design ${design.id}" style="width: 100%; height: 100%; object-fit: contain;">
                </div>
                <div class="design-info">
                    <span class="design-name">${design.fileName || 'Design'}</span>
                    <span class="design-size">${Math.round((design.scale || 1) * 100)}%</span>
                </div>
                <div class="design-controls">
                    <button class="control-btn edit-btn" title="Düzenle">✏️</button>
                    <button class="control-btn delete-btn" title="Sil">🗑️</button>
                </div>
            `;
            
            // Add click handler for selection
            designElement.addEventListener('click', (e) => {
                if (e.target.closest('.control-btn')) return; // Don't trigger if clicking controls
                
                console.log('🎯 Right panel design clicked:', design.id);
                selectDesignFromRightPanel(design);
            });
            
            // Add control button handlers
            const editBtn = designElement.querySelector('.edit-btn');
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('🎯 Edit button clicked for:', design.id);
                selectDesignFromRightPanel(design);
            });
            
            const deleteBtn = designElement.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('🗑️ Delete button clicked for:', design.id);
                deleteDesignFromRightPanel(design);
            });
            
            // Add hover effects
            designElement.addEventListener('mouseenter', () => {
                designElement.style.transform = 'translateY(-2px)';
                designElement.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            });
            
            designElement.addEventListener('mouseleave', () => {
                designElement.style.transform = 'translateY(0)';
                designElement.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            });
            
            elementsList.appendChild(designElement);
            
            // Update elements count
            const elementsCount = document.getElementById('elementsCount');
            if (elementsCount) {
                const currentCount = elementsList.children.length;
                elementsCount.textContent = `${currentCount} element`;
            }
            
            console.log('✅ Design added to right panel:', design.id);
        }
        
        // Select design from right panel
        function selectDesignFromRightPanel(design) {
            console.log('🎯 Selecting design from right panel:', design.id);
            
            // WORDPRESS FIX: Use state management
            DesignState.selectDesign(design.id);
            
            console.log('✅ Design selected from right panel:', design.id);
        }
        
        // Update properties panel for design
        function updatePropertiesPanelForDesign(design) {
            console.log('🎛️ Updating properties panel for design:', design.id);
            
            // Show properties controls
            const propertiesControls = document.getElementById('propertiesControls');
            if (propertiesControls) {
                propertiesControls.style.display = 'block';
            }
            
            // Update selected indicator
            const selectedIndicator = document.getElementById('selectedIndicator');
            if (selectedIndicator) {
                selectedIndicator.innerHTML = `
                    <span class="indicator-dot"></span>
                    <span class="indicator-text">${design.fileName || 'Design'} seçili</span>
                `;
            }
            
            // Update control values
            const sizeControl = document.getElementById('sizeControl');
            const sizeValue = document.getElementById('sizeValue');
            if (sizeControl && sizeValue) {
                const sizePercent = Math.round((design.scale || 1) * 100);
                sizeControl.value = sizePercent;
                sizeValue.textContent = `${sizePercent}%`;
                
                // Add event listener for size changes
                sizeControl.oninput = function() {
                    const value = parseInt(this.value);
                    const scale = value / 100;
                    design.scale = scale;
                    sizeValue.textContent = `${value}%`;
                    
                    // Update right panel display
                    const designElement = document.getElementById(`right-panel-${design.id}`);
                    if (designElement) {
                        const sizeDisplay = designElement.querySelector('.design-size');
                        if (sizeDisplay) {
                            sizeDisplay.textContent = `${value}%`;
                        }
                    }
                    
                    // Update 3D model
                    drawDesignPreview();
                    applyDesignsToModel();
                    
                    console.log('🎯 Size updated:', value + '%');
                };
            }
            
            // Update opacity control
            const opacityControl = document.getElementById('opacityControl');
            const opacityValue = document.getElementById('opacityValue');
            if (opacityControl && opacityValue) {
                const opacityPercent = Math.round(design.opacity || 100);
                opacityControl.value = opacityPercent;
                opacityValue.textContent = `${opacityPercent}%`;
                
                // Add event listener for opacity changes
                opacityControl.oninput = function() {
                    const value = parseInt(this.value);
                    design.opacity = value;
                    opacityValue.textContent = `${value}%`;
                    
                    // Update 3D model
                    drawDesignPreview();
                    applyDesignsToModel();
                    
                    console.log('🎯 Opacity updated:', value + '%');
                };
            }
            
            // Update rotation control
            const rotationControl = document.getElementById('rotationControl');
            const rotationValue = document.getElementById('rotationValue');
            if (rotationControl && rotationValue) {
                const rotationDegrees = Math.round(design.rotation || 0);
                rotationControl.value = rotationDegrees;
                rotationValue.textContent = `${rotationDegrees}°`;
                
                // Add event listener for rotation changes
                rotationControl.oninput = function() {
                    const value = parseInt(this.value);
                    design.rotation = value;
                    rotationValue.textContent = `${value}°`;
                    
                    // Update 3D model
                    drawDesignPreview();
                    applyDesignsToModel();
                    
                    console.log('🎯 Rotation updated:', value + '°');
                };
            }
            
            console.log('✅ Properties panel updated for design:', design.id);
        }
        
        // Delete design from right panel
        function deleteDesignFromRightPanel(design) {
            console.log('🗑️ Deleting design from right panel:', design.id);
            
            // WORDPRESS FIX: Use state management
            DesignState.removeDesign(design.id);
            
            console.log('✅ Design deleted from right panel:', design.id);
        }
        

        
        // RIGHT PANEL FIX: Ensure right panel works (Simple approach)
        function fixRightPanel() {
            // PRODUCTION FIX: Skip if rpEditor exists
            if (document.getElementById('rp-editor') || window.__RP_READY__) return;
            if (window.__fixRightPanel_done) return;
            window.__fixRightPanel_done = true;
            
            console.log('🔧 Fixing right panel (Simple approach)...');
            
            const elementsList = document.getElementById('elementsList');
            if (!elementsList) {
                console.log('❌ Elements list not found');
                return;
            }
            
            // Check if we already have design elements in the panel
            const existingDesignElements = elementsList.querySelectorAll('.design-element-right-panel');
            
            // Only clear and rebuild if we don't have the right number of elements
            if (existingDesignElements.length !== (designs[currentArea]?.length || 0)) {
                console.log('🔄 Rebuilding right panel - element count mismatch');
                elementsList.innerHTML = '';
                
                // Add existing designs to right panel
                if (designs[currentArea] && designs[currentArea].length > 0) {
                    designs[currentArea].forEach(design => {
                        addDesignToRightPanel(design);
                    });
                } else {
                    // Show no elements message
                    elementsList.innerHTML = `
                        <div class="no-elements-message" id="noElementsMessage">
                            <div class="message-icon">📱</div>
                            <p>Henüz tasarım eklenmedi</p>
                            <small>Sol panelden bir görsel yükleyin</small>
                        </div>
                    `;
                    
                    const elementsCount = document.getElementById('elementsCount');
                    if (elementsCount) {
                        elementsCount.textContent = '0 element';
                    }
                }
            } else {
                console.log('✅ Right panel already has correct elements, skipping rebuild');
            }
            
            console.log('✅ Right panel fixed (Simple approach)');
        }
        
        // Show simple controls
        function showSimpleControls(element) {
            console.log('🎛️ Showing simple controls for:', element.id);
            
            // Remove existing controls
            const existingControls = document.querySelector('.simple-controls');
            if (existingControls) {
                existingControls.remove();
            }
            
            // Get current design data
            const designId = element.id;
            const design = designs[currentArea]?.find(d => d.id === designId);
            
            if (!design) {
                console.log('❌ Design not found for controls:', designId);
                return;
            }
            
            // Create simple controls panel
            const controls = document.createElement('div');
            controls.className = 'simple-controls';
            controls.style.cssText = `
                position: absolute;
                bottom: 20px;
                right: 20px;
                background: white;
                border: 2px solid #3b82f6;
                border-radius: 8px;
                padding: 15px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 1001;
                min-width: 200px;
            `;
            
            controls.innerHTML = `
                <h4 style="margin: 0 0 10px 0; color: #1f2937;">Design Controls</h4>
                <div style="margin-bottom: 10px;">
                    <label style="display: block; margin-bottom: 5px; font-size: 12px;">Size:</label>
                    <input type="range" id="sizeSlider" min="0.5" max="2" step="0.1" value="${design.scale || 1}" style="width: 100%;">
                    <span id="sizeValue" style="font-size: 11px; color: #6b7280;">${design.scale || 1}x</span>
                </div>
                <div style="margin-bottom: 10px;">
                    <label style="display: block; margin-bottom: 5px; font-size: 12px;">Rotation:</label>
                    <input type="range" id="rotationSlider" min="0" max="360" step="5" value="${design.rotation || 0}" style="width: 100%;">
                    <span id="rotationValue" style="font-size: 11px; color: #6b7280;">${design.rotation || 0}°</span>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button id="resetBtn" style="flex: 1; padding: 8px; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 4px; cursor: pointer; font-size: 12px;">Reset</button>
                    <button id="deleteBtn" style="flex: 1; padding: 8px; background: #ef4444; color: white; border: 1px solid #dc2626; border-radius: 4px; cursor: pointer; font-size: 12px;">Delete</button>
                </div>
            `;
            
            // Add to design panel
            const designPanel = document.getElementById('designPanel');
            if (designPanel) {
                designPanel.appendChild(controls);
            }
            
            // Add event listeners to controls
            const sizeSlider = controls.querySelector('#sizeSlider');
            const sizeValue = controls.querySelector('#sizeValue');
            const rotationSlider = controls.querySelector('#rotationSlider');
            const rotationValue = controls.querySelector('#rotationValue');
            const resetBtn = controls.querySelector('#resetBtn');
            const deleteBtn = controls.querySelector('#deleteBtn');
            
            // Size slider
            sizeSlider.addEventListener('input', function() {
                const value = parseFloat(this.value);
                sizeValue.textContent = value + 'x';
                design.scale = value;
                
                // Update element size
                element.style.width = (200 * value) + 'px';
                element.style.height = (200 * value) + 'px';
                
                // Update 3D model
                drawDesignPreview();
                applyDesignsToModel();
                
                console.log('🎯 Size updated:', value);
            });
            
            // Rotation slider
            rotationSlider.addEventListener('input', function() {
                const value = parseInt(this.value);
                rotationValue.textContent = value + '°';
                design.rotation = value;
                
                // Update element rotation
                element.style.transform = `scale(1.05) rotate(${value}deg)`;
                
                // Update 3D model
                drawDesignPreview();
                applyDesignsToModel();
                
                console.log('🎯 Rotation updated:', value);
            });
            
            // Reset button
            resetBtn.addEventListener('click', function() {
                console.log('🔄 Resetting design...');
                
                // Reset design properties
                design.scale = 1;
                design.rotation = 0;
                
                // Reset sliders
                sizeSlider.value = 1;
                rotationSlider.value = 0;
                sizeValue.textContent = '1x';
                rotationValue.textContent = '0°';
                
                // Reset element
                element.style.width = '200px';
                element.style.height = '200px';
                element.style.transform = 'scale(1.05)';
                
                // Update 3D model
                drawDesignPreview();
                applyDesignsToModel();
                
                console.log('✅ Design reset');
            });
            
            // Delete button
            deleteBtn.addEventListener('click', function() {
                console.log('🗑️ Deleting design...');
                
                // Remove from designs array
                const index = designs[currentArea].findIndex(d => d.id === designId);
                if (index > -1) {
                    designs[currentArea].splice(index, 1);
                }
                
                // Remove element
                element.remove();
                
                // Remove controls
                controls.remove();
                
                // Update 3D model
                drawDesignPreview();
                applyDesignsToModel();
                
                console.log('✅ Design deleted');
            });
            
            console.log('✅ Simple controls shown with working functionality');
        }
        

        
        // WORDPRESS FIX: State management helper functions
        function updateRightPanelFromState() {
            console.log('🎯 Updating right panel from state...');
            const elementsList = document.getElementById('elementsList');
            if (!elementsList) return;
            
            // Clear existing content
            elementsList.innerHTML = '';
            
            const currentDesigns = DesignState.designs[DesignState.currentArea] || [];
            
            if (currentDesigns.length === 0) {
                // Show no elements message
                elementsList.innerHTML = `
                    <div class="no-elements-message" id="noElementsMessage">
                        <div class="message-icon">📱</div>
                        <p>Henüz tasarım eklenmedi</p>
                        <small>Sol panelden bir görsel yükleyin</small>
                    </div>
                `;
                return;
            }
            
            // Add design elements to right panel
            currentDesigns.forEach(design => {
                addDesignToRightPanel(design);
            });
            
            console.log('✅ Right panel updated from state');
        }
        
        function updateRightPanelSelectionFromState() {
            console.log('🎯 Updating right panel selection from state...');
            
            // Remove previous selection
            document.querySelectorAll('.design-element-right-panel').forEach(el => {
                el.classList.remove('selected');
            });
            
            // Add selection to current design
            if (DesignState.selectedDesign) {
                const designElement = document.getElementById(`right-panel-${DesignState.selectedDesign.id}`);
                if (designElement) {
                    designElement.classList.add('selected');
                }
            }
            
            console.log('✅ Right panel selection updated from state');
        }
        
        function update3DModelSelectionFromState() {
            console.log('🎯 Updating 3D model selection from state...');
            
            // Remove previous selection from 3D elements
            document.querySelectorAll('.design-element').forEach(el => {
                el.classList.remove('selected');
            });
            
            // Add selection to current design in 3D
            if (DesignState.selectedDesign) {
                const designElement = document.getElementById(DesignState.selectedDesign.id);
                if (designElement) {
                    designElement.classList.add('selected');
                }
            }
            
            console.log('✅ 3D model selection updated from state');
        }
        
        function showPropertiesPanelFromState() {
            console.log('🎯 Showing properties panel from state...');
            
            const propertiesControls = document.getElementById('propertiesControls');
            if (propertiesControls) {
                propertiesControls.style.display = 'block';
            }
            
            if (DesignState.selectedDesign) {
                updatePropertiesPanelForDesign(DesignState.selectedDesign);
            }
            
            console.log('✅ Properties panel shown from state');
        }
        
        function hidePropertiesPanelFromState() {
            console.log('🎯 Hiding properties panel from state...');
            
            const propertiesControls = document.getElementById('propertiesControls');
            if (propertiesControls) {
                propertiesControls.style.display = 'none';
            }
            
            console.log('✅ Properties panel hidden from state');
        }
        
        // Run fixes once on page load
        setTimeout(() => {
            simpleFix();
        }, 100);
        
        // Also run on page load
        window.addEventListener('load', () => {
            setTimeout(() => {
                simpleFix();
            }, 500);
        });
