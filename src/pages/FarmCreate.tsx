import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FormSteps } from '@/components/FormSteps';
import { BoundaryTracer } from '@/components/BoundaryTracer';
import { useFarmStore } from '@/stores/farmStore';
import type { Direction, FarmingType, SoilType, Alignment, Point } from '@/types/farm.types';

const FORM_STEPS = [
  { number: 1, title: 'Basic Info', description: 'Name and description' },
  { number: 2, title: 'Location & Area', description: 'Map location and size' },
  { number: 3, title: 'FMB Sketch', description: 'Upload and trace boundary' },
  { number: 4, title: 'Farm Details', description: 'Entry, fencing, roads' },
  { number: 5, title: 'Farming Type', description: 'Type and soil' },
];

export const FarmCreate = () => {
  const navigate = useNavigate();
  const { addFarm, setMode } = useFarmStore();
  const [currentStep, setCurrentStep] = useState(1);

  // Form state - Step 1: Basic Info
  const [farmName, setFarmName] = useState('');
  const [farmDescription, setFarmDescription] = useState('');

  // Form state - Step 2: Location & Area
  const [area, setArea] = useState('');
  const [locationLat, setLocationLat] = useState('');
  const [locationLng, setLocationLng] = useState('');

  // Form state - Step 3: FMB Sketch
  const [fmbFile, setFmbFile] = useState<File | null>(null);
  const [fmbPreview, setFmbPreview] = useState<string | null>(null);
  const [showBoundaryTracer, setShowBoundaryTracer] = useState(false);
  const [boundaryPoints, setBoundaryPoints] = useState<Point[]>([]);
  const [_tracedArea, setTracedArea] = useState<number>(0); // Will be used for area validation later

  // Form state - Step 4: Farm Details
  const [isFenced, setIsFenced] = useState(false);
  const [entrySide, setEntrySide] = useState<Direction>('north');
  const [entryAlignment, setEntryAlignment] = useState<Alignment>('center');
  const [roadBorders, setRoadBorders] = useState<Direction[]>([]);

  // Form state - Step 5: Farming Type
  const [farmingType, setFarmingType] = useState<FarmingType>('single-layer');
  const [soilType, setSoilType] = useState<SoilType>('red');
  const [multilayerCount, setMultilayerCount] = useState(1);

  const handleFmbUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFmbFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setFmbPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRoadBorderToggle = (direction: Direction) => {
    setRoadBorders((prev) =>
      prev.includes(direction)
        ? prev.filter((d) => d !== direction)
        : [...prev, direction]
    );
  };

  const handleStartBoundaryTrace = () => {
    if (fmbPreview) {
      setShowBoundaryTracer(true);
    }
  };

  const handleBoundaryTraceComplete = (points: Point[], pixelArea: number) => {
    setBoundaryPoints(points);
    setTracedArea(pixelArea);
    setShowBoundaryTracer(false);
    // Delete the FMB file after tracing (as per requirements)
    setFmbFile(null);
  };

  const handleBoundaryTraceCancel = () => {
    setShowBoundaryTracer(false);
  };

  const nextStep = () => {
    if (currentStep < FORM_STEPS.length) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    const newFarm = {
      id: Date.now().toString(),
      userId: 'user-1', // TODO: Get from auth
      name: farmName,
      description: farmDescription,
      location: {
        lat: parseFloat(locationLat) || 0,
        lng: parseFloat(locationLng) || 0,
      },
      boundary: {
        points: boundaryPoints,
        area: parseFloat(area) || 0,
      },
      fenced: isFenced,
      entry: {
        side: entrySide,
        alignment: entryAlignment,
      },
      roadBorders: {
        sides: roadBorders,
      },
      farmingType,
      soilType,
      buildings: [],
      plantConfigurations: [],
      plants: [],
      waterSources: [],
      pipelines: [],
      gateValves: [],
      livestock: [],
      livestockEnclosures: [],
      otherElements: [],
      farmNotes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    addFarm(newFarm as any); // TODO: Fix type
    setMode('edit'); // Open in Edit Mode for drag-and-drop positioning
    navigate('/farm-view');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Farm Name *
              </label>
              <input
                type="text"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                placeholder="e.g., Guru's Coconut Farm"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600
                           bg-pearl dark:bg-bg-dark text-gray-800 dark:text-gray-100
                           focus:ring-2 focus:ring-farm-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={farmDescription}
                onChange={(e) => setFarmDescription(e.target.value)}
                placeholder="Brief description of your farm..."
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600
                           bg-pearl dark:bg-bg-dark text-gray-800 dark:text-gray-100
                           focus:ring-2 focus:ring-farm-green-500 focus:border-transparent"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Area (in acres) *
              </label>
              <input
                type="number"
                step="0.01"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g., 5.25"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600
                           bg-pearl dark:bg-bg-dark text-gray-800 dark:text-gray-100
                           focus:ring-2 focus:ring-farm-green-500 focus:border-transparent"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Enter area with up to 2 decimal places
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={locationLat}
                  onChange={(e) => setLocationLat(e.target.value)}
                  placeholder="e.g., 11.0168"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600
                             bg-pearl dark:bg-bg-dark text-gray-800 dark:text-gray-100
                             focus:ring-2 focus:ring-farm-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={locationLng}
                  onChange={(e) => setLocationLng(e.target.value)}
                  placeholder="e.g., 76.9558"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600
                             bg-pearl dark:bg-bg-dark text-gray-800 dark:text-gray-100
                             focus:ring-2 focus:ring-farm-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                📍 TNGIS Map Integration: Coming soon! You'll be able to select your farm location
                directly from an interactive map.
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upload FMB Sketch *
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Upload your farm's FMB (Field Measurement Book) sketch as JPG, PNG, or PDF.
                If you don't have it,{' '}
                <a
                  href="https://eservices.tn.gov.in/eservicesnew/land/chittaCheckNewRuralFMB_en.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-farm-green-600 hover:underline"
                >
                  download it here
                </a>
                .
              </p>

              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed
                                border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer
                                hover:border-farm-green-500 hover:bg-farm-green-50 dark:hover:bg-farm-green-900/10
                                transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {fmbPreview ? (
                    <img src={fmbPreview} alt="FMB Preview" className="max-h-48 rounded" />
                  ) : (
                    <>
                      <svg className="w-12 h-12 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        PNG, JPG or PDF (Max 10MB)
                      </p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFmbUpload}
                  className="hidden"
                />
              </label>

              {fmbFile && (
                <p className="mt-2 text-sm text-farm-green-600">
                  ✓ {fmbFile.name} uploaded
                </p>
              )}
            </div>

            {/* Boundary Tracing Button */}
            {fmbPreview && !boundaryPoints.length && (
              <div>
                <button
                  onClick={handleStartBoundaryTrace}
                  className="w-full px-6 py-4 bg-farm-green-600 hover:bg-farm-green-700 text-pearl
                             rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Trace Farm Boundary</span>
                </button>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                  Click to start tracing your farm's boundary on the sketch
                </p>
              </div>
            )}

            {/* Traced Boundary Info */}
            {boundaryPoints.length > 0 && (
              <div className="bg-farm-green-50 dark:bg-farm-green-900/20 border-2 border-farm-green-500 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <svg className="w-6 h-6 text-farm-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="font-semibold text-farm-green-800 dark:text-farm-green-200">
                      ✓ Boundary Traced Successfully
                    </p>
                    <p className="text-sm text-farm-green-700 dark:text-farm-green-300 mt-1">
                      {boundaryPoints.length} points marked
                    </p>
                    <button
                      onClick={() => {
                        setBoundaryPoints([]);
                        setTracedArea(0);
                      }}
                      className="mt-2 text-sm text-farm-green-600 hover:text-farm-green-700 underline"
                    >
                      Re-trace boundary
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Info Box */}
            {!fmbPreview && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  🖊️ After uploading, you'll trace your farm's boundary by connecting points on the sketch.
                  The sketch will be deleted after tracing is complete.
                </p>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFenced}
                  onChange={(e) => setIsFenced(e.target.checked)}
                  className="w-5 h-5 text-farm-green-600 rounded focus:ring-farm-green-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Farm is fenced
                </span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Entry Location
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">
                    From which side?
                  </label>
                  <select
                    value={entrySide}
                    onChange={(e) => setEntrySide(e.target.value as Direction)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                               bg-pearl dark:bg-bg-dark text-gray-800 dark:text-gray-100
                               focus:ring-2 focus:ring-farm-green-500"
                  >
                    <option value="north">North</option>
                    <option value="south">South</option>
                    <option value="east">East</option>
                    <option value="west">West</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">
                    Alignment
                  </label>
                  <select
                    value={entryAlignment}
                    onChange={(e) => setEntryAlignment(e.target.value as Alignment)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                               bg-pearl dark:bg-bg-dark text-gray-800 dark:text-gray-100
                               focus:ring-2 focus:ring-farm-green-500"
                  >
                    <option value="center">Center</option>
                    <option value="top-left">Top Left Corner</option>
                    <option value="top-right">Top Right Corner</option>
                    <option value="bottom-left">Bottom Left Corner</option>
                    <option value="bottom-right">Bottom Right Corner</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Is there a road on any border of the farm?
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(['north', 'south', 'east', 'west'] as Direction[]).map((direction) => (
                  <label key={direction} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={roadBorders.includes(direction)}
                      onChange={() => handleRoadBorderToggle(direction)}
                      className="w-4 h-4 text-farm-green-600 rounded focus:ring-farm-green-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                      {direction} side
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Farming Type *
              </label>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { value: 'single-layer', label: 'Single Layer Farming', desc: 'One type of crop' },
                  { value: 'multilayer', label: 'Multilayer Farming', desc: 'Multiple crop layers' },
                  { value: 'livestock-only', label: 'Livestock Only', desc: 'No crops' },
                  { value: 'empty', label: 'Empty', desc: 'No farming yet' },
                  { value: 'fallow', label: 'Fallow', desc: 'Resting land' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      farmingType === option.value
                        ? 'border-farm-green-600 bg-farm-green-50 dark:bg-farm-green-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-farm-green-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="farmingType"
                      value={option.value}
                      checked={farmingType === option.value}
                      onChange={(e) => setFarmingType(e.target.value as FarmingType)}
                      className="w-5 h-5 text-farm-green-600 focus:ring-farm-green-500"
                    />
                    <div className="ml-3">
                      <p className="font-medium text-gray-800 dark:text-gray-100">{option.label}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{option.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {farmingType === 'multilayer' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Number of Layers
                </label>
                <input
                  type="number"
                  min="2"
                  max="5"
                  value={multilayerCount}
                  onChange={(e) => setMultilayerCount(parseInt(e.target.value))}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600
                             bg-pearl dark:bg-bg-dark text-gray-800 dark:text-gray-100
                             focus:ring-2 focus:ring-farm-green-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Soil Type *
              </label>
              <select
                value={soilType}
                onChange={(e) => setSoilType(e.target.value as SoilType)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600
                           bg-pearl dark:bg-bg-dark text-gray-800 dark:text-gray-100
                           focus:ring-2 focus:ring-farm-green-500"
              >
                <option value="red">Red Soil</option>
                <option value="black">Black Soil</option>
                <option value="alluvial">Alluvial Soil</option>
                <option value="clay">Clay Soil</option>
                <option value="sandy">Sandy Soil</option>
                <option value="loamy">Loamy Soil</option>
                <option value="limestone">Limestone Soil</option>
              </select>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-frost dark:bg-bg-dark p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            Create New Farm
          </h1>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200
                       transition-colors"
          >
            Cancel
          </button>
        </div>

        <div className="bg-pearl dark:bg-bg-dark-alt rounded-xl p-8">
          <FormSteps steps={FORM_STEPS} currentStep={currentStep} />

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                currentStep === 1
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-100 hover:bg-gray-400 dark:hover:bg-gray-500'
              }`}
            >
              Previous
            </button>

            {currentStep < FORM_STEPS.length ? (
              <button
                onClick={nextStep}
                className="px-6 py-3 bg-farm-green-600 hover:bg-farm-green-700 text-pearl rounded-lg
                           font-semibold transition-colors"
              >
                Next Step
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-6 py-3 bg-farm-green-600 hover:bg-farm-green-700 text-pearl rounded-lg
                           font-semibold transition-colors"
              >
                Create Farm
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Boundary Tracer Modal */}
      {showBoundaryTracer && fmbPreview && (
        <BoundaryTracer
          imageUrl={fmbPreview}
          onComplete={handleBoundaryTraceComplete}
          onCancel={handleBoundaryTraceCancel}
        />
      )}
    </div>
  );
};
