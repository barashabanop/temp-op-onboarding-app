import { ArrowRight } from 'lucide-react'

interface WorkflowStepsProps {
  steps: string[]
  expanded?: boolean
}

export function WorkflowSteps({ steps, expanded = false }: WorkflowStepsProps) {
  return (
    <div className={`product-flow ${expanded ? 'product-flow--expanded' : ''}`}>
      {steps.map((step, index) => (
        <div key={step} className={index === 2 ? 'is-current' : ''}>
          <span>{String(index + 1).padStart(2, '0')}</span>
          <strong>{step}</strong>
          {index < steps.length - 1 && <ArrowRight />}
        </div>
      ))}
    </div>
  )
}
