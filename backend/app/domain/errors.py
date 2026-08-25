class DomainError(Exception):
    """Base class for expected business errors."""


class NotFoundError(DomainError):
    pass


class InvalidTransitionError(DomainError):
    pass


class EmployeeUnavailableError(DomainError):
    pass


class ExecutionError(DomainError):
    pass
