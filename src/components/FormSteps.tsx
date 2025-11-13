import { motion } from 'framer-motion';

interface Step {
  number: number;
  title: string;
  description: string;
}

interface FormStepsProps {
  steps: Step[];
  currentStep: number;
}

export const FormSteps = ({ steps, currentStep }: FormStepsProps) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{
                  scale: currentStep === step.number ? 1.1 : 1,
                  backgroundColor:
                    currentStep > step.number
                      ? 'rgb(22 163 74)' // farm-green-600
                      : currentStep === step.number
                      ? 'rgb(34 197 94)' // farm-green-500
                      : 'rgb(203 213 225)', // gray-300
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                           ${currentStep >= step.number ? 'text-pearl' : 'text-gray-600 dark:text-gray-400'}`}
              >
                {currentStep > step.number ? '✓' : step.number}
              </motion.div>
              <p
                className={`mt-2 text-xs font-medium text-center max-w-[100px] ${
                  currentStep === step.number
                    ? 'text-farm-green-600'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {step.title}
              </p>
            </div>

            {/* Connecting Line */}
            {index < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 bg-gray-300 dark:bg-gray-600 relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: currentStep > step.number ? '100%' : '0%',
                  }}
                  transition={{ duration: 0.5 }}
                  className="absolute h-full bg-farm-green-600"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
