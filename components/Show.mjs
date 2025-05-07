import { h } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import { useEffect, useState, useRef, useMemo, useCallback } from '../importmap/preact/hooks/src/index.js';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';
import Pic from './Pic.mjs';
import Mark from './Mark.mjs';

const html = htm.bind(h);

/**
 * Show component for displaying image galleries in rows with consistent heights
 * 
 * @param {Object} props Component props
 * @param {Array} props.imageItems Array of image items with { fileName, marker, caption } properties
 * @param {number} props.targetRowAspectRatio Target aspect ratio for rows (width/height), defaults to 2:1
 */
function Show({ imageItems, targetRowAspectRatio = 2 }) {
  // Initialize stylesheet
  useEffect(() => {
    requireStylesheet(browser.runtime.getURL('/components/show.css'));
  }, []);

  // Generate a content key from the image items to detect changes
  const contentKey = useMemo(() => {
    const key = (imageItems || [])
      .map(img => img.fileName)
      .join('|');
    return key;
  }, [imageItems]);

  // State to track loaded images and their dimensions
  const [loadedImages, setLoadedImages] = useState([]);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isVisible, setIsVisible] = useState(true); // Start visible by default
  const [forceRender, setForceRender] = useState(0); // Used to force re-renders
  const containerRef = useRef(null);
  const observersRef = useRef(null);
  const prevContentKeyRef = useRef('');

  // Force reset of state when content changes
  useEffect(() => {
    if (prevContentKeyRef.current && prevContentKeyRef.current !== contentKey) {
      setLoadedImages([]); // Clear loaded images
      setForceRender(prev => prev + 1); // Force a re-render
      prevContentKeyRef.current = contentKey;
    } else if (!prevContentKeyRef.current) {
      prevContentKeyRef.current = contentKey;
    }
  }, [contentKey]);

  // Set up observers for container size and visibility
  useEffect(() => {
    if (!containerRef.current) return;
    
    
    // Get an initial container width measurement
    const initialWidth = containerRef.current.offsetWidth;
    setContainerWidth(initialWidth);
    
    // Track when the component becomes visible in viewport
    const intersectionObserver = new IntersectionObserver(
      entries => {
        const [entry] = entries;
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 } // Trigger when at least 10% of component is visible
    );
    
    // Track when the container resizes
    const resizeObserver = new ResizeObserver(entries => {
      if (!containerRef.current) return;
      
      const newWidth = containerRef.current.offsetWidth;
      setContainerWidth(newWidth);
    });
    
    // Start observing
    intersectionObserver.observe(containerRef.current);
    resizeObserver.observe(containerRef.current);
    
    // Store observers for cleanup
    observersRef.current = { intersectionObserver, resizeObserver };
    
    // Clean up observers when component unmounts
    return () => {
      if (observersRef.current) {
        observersRef.current.intersectionObserver.disconnect();
        observersRef.current.resizeObserver.disconnect();
      }
    };
  }, [forceRender]); // Re-setup observers when forceRender changes

  // Check if we have any images to display
  const allImages = imageItems || [];
  if (allImages.length === 0) {
    return null; // No images to show
  }

  // Memoized handler to avoid creating new functions on each render
  const handleImageLoad = useCallback((event, index) => {
    const { naturalWidth, naturalHeight } = event.target;
    
    setLoadedImages(prevLoaded => {
      // Create a new array if the previous one isn't big enough
      const newLoaded = Array.isArray(prevLoaded) && prevLoaded.length >= allImages.length
        ? [...prevLoaded]
        : new Array(allImages.length).fill(null);
      
      newLoaded[index] = {
        width: naturalWidth,
        height: naturalHeight,
        aspectRatio: naturalWidth / naturalHeight,
        loaded: true
      };
      return newLoaded;
    });
  }, [allImages.length]);

  // Only calculate rows when we have both container width and loaded images
  let imageRows = [];
  const loadedCount = loadedImages.filter(img => img?.loaded).length;
  const allImagesLoaded = loadedCount === allImages.length && allImages.length > 0;
  
  
  if (containerWidth > 0 && allImagesLoaded) {
    // Use provided targetRowAspectRatio or default to 2:1
    const targetRowHeight = containerWidth / targetRowAspectRatio;
    
    let currentRow = [];
    let currentRowAspectRatio = 0;
    
    // Helper function to layout a row
    const layoutRow = (row, containerWidth) => {
      if (row.length === 0) return [];
      
      // Calculate total aspect ratio for the row
      const totalAspectRatio = row.reduce((sum, imgIndex) => 
        sum + loadedImages[imgIndex].aspectRatio, 0);
      
      // Calculate height based on target container width
      const rowHeight = containerWidth / totalAspectRatio;
      
      // Ensure no image exceeds its natural size
      const maxScale = Math.max(...row.map(imgIndex => 
        rowHeight / (loadedImages[imgIndex].height || 1)));
      
      const finalHeight = maxScale > 1 
        ? rowHeight / maxScale  // Scale down if any image would be enlarged
        : rowHeight;
      
      return row.map(imgIndex => ({
        imgIndex,
        width: loadedImages[imgIndex].aspectRatio * finalHeight,
        height: finalHeight
      }));
    };
    
    // Group images into rows - simpler approach
    allImages.forEach((_, index) => {
      if (!loadedImages[index]?.loaded) return;
      
      const imgAspectRatio = loadedImages[index].aspectRatio;
      
      // Start a new row if:
      // 1. This is the first image, OR
      // 2. Adding this image would make the row exceed the target width
      if (currentRow.length === 0) {
        // First image in a row
        currentRow.push(index);
        currentRowAspectRatio = imgAspectRatio;
      } else {
        // Check if adding this image keeps the row below the target width
        const newRowAspectRatio = currentRowAspectRatio + imgAspectRatio;
        
        // If the new row aspect ratio would make the row too tall:
        if (newRowAspectRatio > targetRowAspectRatio * 1.5) {
          // Complete the current row
          imageRows.push(layoutRow(currentRow, containerWidth));
          
          // Start a new row with this image
          currentRow = [index];
          currentRowAspectRatio = imgAspectRatio;
        } else {
          // Add to the current row
          currentRow.push(index);
          currentRowAspectRatio = newRowAspectRatio;
        }
      }
    });
    
    // Don't forget the last row
    if (currentRow.length > 0) {
      imageRows.push(layoutRow(currentRow, containerWidth));
    }
    
  }

  // Helper function to render an image item
  const renderImageItem = (image, index, dimensions = null) => {
    const srcUrl = image.fileName.startsWith('http') 
      ? image.fileName 
      : `https://commons.wikimedia.org/w/index.php?title=Special:FilePath/${image.fileName}`;
      
    const href = image.href || (image.fileName.startsWith('http') 
      ? image.fileName 
      : `https://commons.wikimedia.org/wiki/File:${image.fileName}`);
    
    const style = dimensions 
      ? { width: dimensions.width + 'px' }
      : { width: '200px', height: '150px' }; // Default size for loading state
    
    const className = dimensions 
      ? 'show__item' 
      : 'show__item show__item--loading';
    
    return html`
      <div class=${className} key=${srcUrl} style=${style}>
        <a href="${href}" class="show__image">
          <img 
            src=${srcUrl}
            onLoad=${(e) => handleImageLoad(e, index)}
            style="display: none;"
          />
          <${Pic} src=${srcUrl} />
        </a>
        ${image.marker && html`
          <div class="show__marker">
            <${Mark} ordinal=${image.marker} />
          </div>
        `}
        ${image.caption && html`
          <div class="show__caption">${image.caption}</div>
        `}
      </div>
    `;
  };

  const SimpleView = () => html`
    <div class="show" ref=${containerRef} key=${contentKey + '-' + forceRender}>
      ${!allImagesLoaded && html`
        ${allImages.map((image, index) => renderImageItem(image, index))}
      `}
      
      ${allImagesLoaded && html`
        ${imageRows.map((row) => html`
          <div class="show__row">
            ${row.map(item => renderImageItem(allImages[item.imgIndex], item.imgIndex, item))}
          </div>
        `)}
      `}
    </div>
  `;

  return SimpleView();
}

export default Show; 