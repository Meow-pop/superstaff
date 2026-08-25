import type { Employee } from '../types/contracts'

interface EmployeeCardProps {
  employee: Employee
  selected: boolean
  onSelect: (employee: Employee) => void
}

export function EmployeeCard({ employee, selected, onSelect }: EmployeeCardProps) {
  const available = employee.status === 'ready'
  return (
    <button
      type="button"
      className={`employee-card ${selected ? 'employee-card-selected' : ''}`}
      onClick={() => onSelect(employee)}
      aria-pressed={selected}
    >
      <div className="employee-avatar" aria-hidden="true">
        {employee.avatar}
      </div>
      <div className="employee-copy">
        <div className="employee-title-row">
          <strong>{employee.name}</strong>
          <span className={available ? 'availability-ready' : 'availability-soon'}>
            {available ? '可工作' : '准备中'}
          </span>
        </div>
        <span className="employee-role">{employee.role}</span>
        <p>{employee.mission}</p>
        <div className="skill-list">
          {employee.skills.map((skill) => (
            <span key={skill}>{skill}</span>
          ))}
        </div>
      </div>
    </button>
  )
}
