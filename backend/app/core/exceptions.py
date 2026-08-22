"""Custom exceptions for AgroGenesis AI."""

from fastapi import HTTPException, status


class AgroGenesisException(Exception):
    """Base exception for AgroGenesis AI."""
    pass


class FieldNotFoundError(AgroGenesisException):
    """Raised when a field is not found."""
    def __init__(self, field_id: str):
        self.field_id = field_id
        super().__init__(f"Field not found: {field_id}")


class PrescriptionNotFoundError(AgroGenesisException):
    """Raised when a prescription is not found."""
    def __init__(self, prescription_id: str):
        self.prescription_id = prescription_id
        super().__init__(f"Prescription not found: {prescription_id}")


class TelemetryParseError(AgroGenesisException):
    """Raised when telemetry data cannot be parsed."""
    def __init__(self, format_type: str, detail: str = ""):
        self.format_type = format_type
        self.detail = detail
        super().__init__(f"Failed to parse {format_type} telemetry: {detail}")


class ImageryProcessingError(AgroGenesisException):
    """Raised when imagery processing fails."""
    def __init__(self, detail: str = ""):
        self.detail = detail
        super().__init__(f"Imagery processing failed: {detail}")


class DeepSeekAPIError(AgroGenesisException):
    """Raised when DeepSeek API call fails."""
    def __init__(self, detail: str = ""):
        self.detail = detail
        super().__init__(f"DeepSeek API error: {detail}")


class EcoFinCalculationError(AgroGenesisException):
    """Raised when EcoFin calculation fails."""
    def __init__(self, detail: str = ""):
        self.detail = detail
        super().__init__(f"EcoFin calculation error: {detail}")


# HTTP exception helpers
def not_found(detail: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


def bad_request(detail: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


def internal_error(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=detail
    )
