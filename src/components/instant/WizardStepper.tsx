"use client";

interface WizardStepperProps {
  currentStep: number;
  steps: { label: string; description: string }[];
  onStepClick?: (step: number) => void;
}

export default function WizardStepper({ currentStep, steps, onStepClick }: WizardStepperProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          const isClickable = isCompleted || isActive;

          return (
            <div key={index} className="flex items-center flex-1">
              {/* Step circle and label */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => isClickable && onStepClick?.(stepNumber)}
                  disabled={!isClickable}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    isCompleted
                      ? "bg-green-600 text-white hover:bg-green-500 cursor-pointer"
                      : isActive
                      ? "bg-amber-500 text-white"
                      : "bg-gray-700 text-gray-400 cursor-not-allowed"
                  }`}
                  title={isClickable ? `Go to ${step.label}` : "Complete previous steps first"}
                >
                  {isCompleted ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                  ) : (
                    stepNumber
                  )}
                </button>
                <button
                  onClick={() => isClickable && onStepClick?.(stepNumber)}
                  disabled={!isClickable}
                  className="mt-2 text-center"
                >
                  <div
                    className={`text-xs font-medium transition-colors ${
                      isActive
                        ? "text-amber-500"
                        : isCompleted
                        ? "text-green-500 hover:text-green-400 cursor-pointer"
                        : "text-gray-500"
                    }`}
                  >
                    {step.label}
                  </div>
                  <div className="text-[10px] text-gray-600 hidden sm:block">
                    {step.description}
                  </div>
                </button>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${
                    stepNumber < currentStep ? "bg-green-600" : "bg-gray-700"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
