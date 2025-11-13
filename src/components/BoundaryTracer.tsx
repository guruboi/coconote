import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Point } from '@/types/farm.types';

interface BoundaryTracerProps {
  imageUrl: string;
  onComplete: (points: Point[], area: number) => void;
  onCancel: () => void;
}

export const BoundaryTracer = ({ imageUrl, onComplete, onCancel }: BoundaryTracerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [hoveredFirstPoint, setHoveredFirstPoint] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // Load image and set canvas size
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      if (imageRef.current) {
        imageRef.current = img;
        // Calculate canvas size to fit the container while maintaining aspect ratio
        const maxWidth = 800;
        const maxHeight = 600;
        const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
        const width = img.width * ratio;
        const height = img.height * ratio;
        setCanvasSize({ width, height });
      }
    };
    img.src = imageUrl;
    imageRef.current = img;
  }, [imageUrl]);

  // Draw on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !imageRef.current || canvasSize.width === 0) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image
    ctx.drawImage(imageRef.current, 0, 0, canvasSize.width, canvasSize.height);

    // Draw semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (points.length > 0) {
      // Draw lines between points
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }

      // If complete, close the shape
      if (isComplete) {
        ctx.closePath();
        ctx.fillStyle = 'rgba(34, 197, 94, 0.2)'; // farm-green with transparency
        ctx.fill();
      }

      ctx.strokeStyle = '#22c55e'; // farm-green-500
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw points
      points.forEach((point, index) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = index === 0 ? '#ef4444' : '#22c55e'; // first point is red
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw point number
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((index + 1).toString(), point.x, point.y);
      });

      // Draw hover effect on first point when close to completing
      if (points.length >= 3 && hoveredFirstPoint) {
        ctx.beginPath();
        ctx.arc(points[0].x, points[0].y, 10, 0, Math.PI * 2);
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }
  }, [points, isComplete, hoveredFirstPoint, canvasSize]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isComplete) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking near the first point to complete the boundary
    if (points.length >= 3) {
      const firstPoint = points[0];
      const distance = Math.sqrt(
        Math.pow(x - firstPoint.x, 2) + Math.pow(y - firstPoint.y, 2)
      );

      if (distance < 15) {
        // Complete the boundary
        setIsComplete(true);
        return;
      }
    }

    // Add new point
    setPoints([...points, { x, y }]);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isComplete || points.length < 3) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const firstPoint = points[0];
    const distance = Math.sqrt(
      Math.pow(x - firstPoint.x, 2) + Math.pow(y - firstPoint.y, 2)
    );

    setHoveredFirstPoint(distance < 15);
  };

  const handleUndo = () => {
    if (points.length > 0) {
      setPoints(points.slice(0, -1));
    }
  };

  const handleReset = () => {
    setPoints([]);
    setIsComplete(false);
  };

  const calculateArea = () => {
    if (points.length < 3) return 0;

    // Calculate area using Shoelace formula
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    area = Math.abs(area) / 2;

    // This is in pixels, we'll need to convert to acres based on the actual farm area
    // For now, return the pixel area
    return area;
  };

  const handleComplete = () => {
    const area = calculateArea();
    onComplete(points, area);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-pearl dark:bg-bg-dark-alt rounded-xl max-w-6xl w-full max-h-screen overflow-auto"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                Trace Farm Boundary
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Click on the sketch to mark boundary points. Click the first point again to complete.
              </p>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1 text-sm text-blue-800 dark:text-blue-200">
                <p className="font-semibold mb-1">How to trace:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Click to place points along your farm's boundary</li>
                  <li>The first point will be <span className="text-red-600 font-semibold">red</span></li>
                  <li>Continue clicking to add more points (minimum 3)</li>
                  <li>Click on the first <span className="text-red-600 font-semibold">red point</span> to complete the boundary</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex justify-center mb-4">
            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              onClick={handleCanvasClick}
              onMouseMove={handleCanvasMouseMove}
              className="border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-crosshair"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between mb-4 p-4 bg-frost dark:bg-bg-dark rounded-lg">
            <div className="flex items-center space-x-6">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Points</p>
                <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{points.length}</p>
              </div>
              {isComplete && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                  <p className="text-lg font-bold text-farm-green-600">✓ Complete</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <div className="flex space-x-2">
              <button
                onClick={handleUndo}
                disabled={points.length === 0}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  points.length === 0
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-100 hover:bg-gray-400'
                }`}
              >
                Undo Last Point
              </button>
              <button
                onClick={handleReset}
                disabled={points.length === 0}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  points.length === 0
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                Reset
              </button>
            </div>

            <button
              onClick={handleComplete}
              disabled={!isComplete}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                !isComplete
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-farm-green-600 hover:bg-farm-green-700 text-pearl'
              }`}
            >
              Confirm Boundary
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
