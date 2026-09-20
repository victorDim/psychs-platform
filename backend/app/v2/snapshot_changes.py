"""Compare capture metadata without parsing or loading untrusted response bodies."""

from typing import Literal, Protocol


SnapshotChange = Literal["baseline_unavailable", "unchanged", "content_changed", "metadata_changed"]


class SnapshotMetadata(Protocol):
    content_sha256: str
    final_url: str
    http_status: int
    content_type: str
    charset: str


def classify_snapshot_change(
    current: SnapshotMetadata, previous: SnapshotMetadata | None,
) -> SnapshotChange:
    # Retention can remove older captures: absence does not mean first capture.
    if previous is None:
        return "baseline_unavailable"
    if current.content_sha256 != previous.content_sha256:
        return "content_changed"
    if any(
        getattr(current, field) != getattr(previous, field)
        for field in ("final_url", "http_status", "content_type", "charset")
    ):
        return "metadata_changed"
    return "unchanged"
