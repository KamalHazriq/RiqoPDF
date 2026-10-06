"""One smoke test per tool route: upload real fixture files, assert a
successful, non-trivial response. Mirrors the manual curl pass every prior
session ran by hand — codified so it's no longer manual."""


def test_merge_pdf(client, sample_pdf, second_pdf):
    with open(sample_pdf, "rb") as f1, open(second_pdf, "rb") as f2:
        res = client.post("/api/tools/merge-pdf", files=[("files", f1), ("files", f2)])
    assert res.status_code == 200
    assert len(res.content) > 50


def test_split_pdf_every_page(client, sample_pdf):
    with open(sample_pdf, "rb") as f:
        res = client.post("/api/tools/split-pdf", files={"file": f}, data={"mode": "every-page"})
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/zip"


def test_split_pdf_page_range(client, sample_pdf):
    with open(sample_pdf, "rb") as f:
        res = client.post("/api/tools/split-pdf", files={"file": f}, data={"mode": "pages", "pages": "1-2"})
    assert res.status_code == 200


def test_organize_pdf(client, sample_pdf):
    with open(sample_pdf, "rb") as f:
        res = client.post("/api/tools/organize-pdf", files={"file": f}, data={"delete_pages": "2"})
    assert res.status_code == 200


def test_rotate_pdf(client, sample_pdf):
    with open(sample_pdf, "rb") as f:
        res = client.post("/api/tools/rotate-pdf", files={"file": f}, data={"degrees": "90"})
    assert res.status_code == 200


def test_crop_pdf(client, sample_pdf):
    with open(sample_pdf, "rb") as f:
        res = client.post("/api/tools/crop-pdf", files={"file": f}, data={"top_percent": "5", "left_percent": "5"})
    assert res.status_code == 200


def test_page_numbers(client, sample_pdf):
    with open(sample_pdf, "rb") as f:
        res = client.post("/api/tools/page-numbers", files={"file": f})
    assert res.status_code == 200


def test_compress_pdf_preset(client, sample_pdf):
    with open(sample_pdf, "rb") as f:
        res = client.post("/api/tools/compress-pdf", files={"file": f}, data={"level": "recommended"})
    assert res.status_code == 200
    assert "x-original-size" in res.headers


def test_compress_pdf_custom_target_met(client, image_heavy_pdf):
    with open(image_heavy_pdf, "rb") as f:
        res = client.post(
            "/api/tools/compress-pdf", files={"file": f}, data={"level": "custom", "target_size_kb": "200"}
        )
    assert res.status_code == 200
    assert res.headers["x-target-met"] == "true"
    assert int(res.headers["x-compressed-size"]) <= 200 * 1024


def test_compress_pdf_custom_target_unreachable(client, image_heavy_pdf):
    with open(image_heavy_pdf, "rb") as f:
        res = client.post(
            "/api/tools/compress-pdf", files={"file": f}, data={"level": "custom", "target_size_kb": "1"}
        )
    assert res.status_code == 200
    assert res.headers["x-target-met"] == "false"


def test_compress_pdf_custom_requires_target(client, sample_pdf):
    with open(sample_pdf, "rb") as f:
        res = client.post("/api/tools/compress-pdf", files={"file": f}, data={"level": "custom"})
    assert res.status_code == 400


def test_repair_pdf(client, sample_pdf):
    with open(sample_pdf, "rb") as f:
        res = client.post("/api/tools/repair-pdf", files={"file": f})
    assert res.status_code == 200


def test_pdf_to_word(client, sample_pdf):
    with open(sample_pdf, "rb") as f:
        res = client.post("/api/tools/pdf-to-word", files={"file": f})
    assert res.status_code == 200


def test_pdf_to_excel(client, sample_pdf):
    with open(sample_pdf, "rb") as f:
        res = client.post("/api/tools/pdf-to-excel", files={"file": f})
    assert res.status_code == 200


def test_pdf_to_powerpoint(client, sample_pdf):
    with open(sample_pdf, "rb") as f:
        res = client.post("/api/tools/pdf-to-powerpoint", files={"file": f})
    assert res.status_code == 200


def test_pdf_to_markdown(client, sample_pdf):
    with open(sample_pdf, "rb") as f:
        res = client.post("/api/tools/pdf-to-markdown", files={"file": f})
    assert res.status_code == 200
    assert b"Test page" in res.content


def test_word_to_pdf(client, sample_docx):
    with open(sample_docx, "rb") as f:
        res = client.post("/api/tools/word-to-pdf", files={"file": f})
    assert res.status_code == 200


def test_excel_to_pdf(client, sample_xlsx):
    with open(sample_xlsx, "rb") as f:
        res = client.post("/api/tools/excel-to-pdf", files={"file": f})
    assert res.status_code == 200


def test_powerpoint_to_pdf(client, sample_pptx):
    with open(sample_pptx, "rb") as f:
        res = client.post("/api/tools/powerpoint-to-pdf", files={"file": f})
    assert res.status_code == 200


def test_pdf_to_html(client, sample_pdf):
    with open(sample_pdf, "rb") as f:
        res = client.post("/api/tools/pdf-to-html", files={"file": f})
    assert res.status_code == 200


def test_pdf_to_jpg(client, sample_pdf):
    with open(sample_pdf, "rb") as f:
        res = client.post("/api/tools/pdf-to-jpg", files={"file": f})
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/zip"  # 3-page PDF -> zip of pages


def test_jpg_to_pdf(client, sample_jpg):
    with open(sample_jpg, "rb") as f:
        res = client.post("/api/tools/jpg-to-pdf", files={"files": f})
    assert res.status_code == 200


def test_watermark_text(client, sample_pdf):
    with open(sample_pdf, "rb") as f:
        res = client.post(
            "/api/tools/watermark",
            files={"file": f},
            data={"watermark_type": "text", "text": "CONFIDENTIAL"},
        )
    assert res.status_code == 200


def test_redact_pdf(client, sample_pdf):
    with open(sample_pdf, "rb") as f:
        res = client.post("/api/tools/redact-pdf", files={"file": f}, data={"search_text": "Hello"})
    assert res.status_code == 200
    assert int(res.headers["x-redaction-count"]) > 0


def test_redact_pdf_no_match(client, sample_pdf):
    with open(sample_pdf, "rb") as f:
        res = client.post("/api/tools/redact-pdf", files={"file": f}, data={"search_text": "nonexistent-xyz"})
    assert res.status_code == 404


def test_pdf_forms(client, sample_pdf):
    with open(sample_pdf, "rb") as f:
        res = client.post(
            "/api/tools/pdf-forms",
            files={"file": f},
            data={"fields": '[{"name":"field1","type":"text","page":1,"x_percent":10,"y_percent":10}]'},
        )
    assert res.status_code == 200


def test_sign_pdf(client, sample_pdf, sample_jpg):
    with open(sample_pdf, "rb") as f1, open(sample_jpg, "rb") as f2:
        res = client.post("/api/tools/sign-pdf", files={"file": f1, "signature": f2})
    assert res.status_code == 200


def test_protect_pdf(client, sample_pdf):
    with open(sample_pdf, "rb") as f:
        res = client.post("/api/tools/protect-pdf", files={"file": f}, data={"password": "secret123"})
    assert res.status_code == 200


def test_protect_pdf_password_too_short(client, sample_pdf):
    with open(sample_pdf, "rb") as f:
        res = client.post("/api/tools/protect-pdf", files={"file": f}, data={"password": "abc"})
    assert res.status_code == 400


def test_unlock_pdf_correct_password(client, encrypted_pdf):
    with open(encrypted_pdf, "rb") as f:
        res = client.post("/api/tools/unlock-pdf", files={"file": f}, data={"password": "correcthorse"})
    assert res.status_code == 200


def test_unlock_pdf_wrong_password(client, encrypted_pdf):
    with open(encrypted_pdf, "rb") as f:
        res = client.post("/api/tools/unlock-pdf", files={"file": f}, data={"password": "wrongpass"})
    assert res.status_code == 403
    assert res.json()["detail"] == "Incorrect password"


def test_ocr_pdf(client, scanned_pdf):
    with open(scanned_pdf, "rb") as f:
        res = client.post("/api/tools/ocr-pdf", files={"file": f}, data={"language": "eng"})
    assert res.status_code == 200
    assert len(res.content) > 50


def test_ocr_pdf_invalid_language(client, scanned_pdf):
    with open(scanned_pdf, "rb") as f:
        res = client.post("/api/tools/ocr-pdf", files={"file": f}, data={"language": "klingon"})
    assert res.status_code == 400


def test_health_check(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


def test_rejects_non_pdf_upload(client, sample_jpg):
    with open(sample_jpg, "rb") as f:
        res = client.post("/api/tools/rotate-pdf", files={"file": f})
    assert res.status_code == 400


# ---- rate limiting (uses its own tiny app: the shared client runs with the
# limit effectively disabled, which is exactly how a silently-broken limiter
# once slipped past this suite) ----

def _limited_client(limit="3/minute"):
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.testclient import TestClient
    from app.ratelimit import RateLimitMiddleware

    app = FastAPI()
    app.add_middleware(RateLimitMiddleware, limit=limit, exempt_paths=("/health",))
    app.add_middleware(CORSMiddleware, allow_origins=["https://example.com"], allow_methods=["*"], allow_headers=["*"])

    @app.get("/work")
    def work():
        return {"ok": True}

    @app.get("/health")
    def health():
        return {"status": "ok"}

    return TestClient(app)


def test_rate_limit_blocks_after_budget_and_exempts_health():
    c = _limited_client()
    assert [c.get("/work").status_code for _ in range(5)] == [200, 200, 200, 429, 429]
    assert c.get("/health").status_code == 200  # exempt even once exhausted


def test_rate_limit_429_has_message_retry_after_and_cors_headers():
    c = _limited_client("1/minute")
    c.get("/work")
    res = c.get("/work", headers={"Origin": "https://example.com"})
    assert res.status_code == 429
    assert "Rate limit exceeded" in res.json()["error"]
    assert int(res.headers["retry-after"]) >= 1
    # Without this a browser surfaces the 429 as an opaque network error.
    assert res.headers["access-control-allow-origin"] == "https://example.com"


def test_rate_limit_ignores_cors_preflight():
    c = _limited_client("1/minute")
    for _ in range(3):
        assert c.options("/work", headers={"Origin": "https://example.com", "Access-Control-Request-Method": "GET"}).status_code == 200
    assert c.get("/work").status_code == 200
