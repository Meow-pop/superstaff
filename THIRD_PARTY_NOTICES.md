# Third-party notices

Superstaff is proprietary software built on permissively licensed open-source
components. These components can be used in commercial products without asking
their authors for a separate commercial licence, provided their licence notices
and conditions are followed.

## Application dependencies

| Component | Role | Licence |
| --- | --- | --- |
| React / React DOM | Web interface runtime | MIT |
| Vite / Vitest | Build and test tooling | MIT |
| TypeScript | Build tooling | Apache-2.0 |
| FastAPI | Backend framework | MIT |
| Uvicorn | ASGI server | BSD-3-Clause |
| HTTPX | HTTP client | BSD-3-Clause |
| pytest | Test tooling | MIT |
| Python | Backend runtime | PSF-2.0 |
| nginx | Container web server | BSD-2-Clause |
| certifi | CA certificate bundle used by HTTPX | MPL-2.0 |
| Lightning CSS | Frontend build tooling | MPL-2.0 |

## Optional local AI profile

| Component | Role | Licence |
| --- | --- | --- |
| Ollama server and API | Local model runtime | MIT |
| Qwen3 open-weight models | Local language model | Apache-2.0; verify the exact model card before each release |

Model weights are downloaded on the customer's machine and are not committed to
this repository. A commercial release must pin the exact image and model digest,
archive their licence texts, and regenerate the software bill of materials.

## Distribution obligations

- Preserve the copyright and licence notices required by MIT, BSD, ISC,
  Apache-2.0, PSF-2.0 and MPL-2.0 components.
- If MPL-covered files are modified and distributed, make those modified files
  available under MPL-2.0 as required; this does not require opening unrelated
  proprietary application files.
- Do not use upstream project names or trademarks to imply endorsement.
- Verify every optional voice, image, music, font and model asset separately;
  the runtime's licence does not automatically cover its downloadable assets.
- Container engines and desktop runtimes are installed by the customer and may
  have their own subscription terms. The standalone application licence does not
  grant rights to those external products.

This inventory covers the declared direct stack and commercial architecture. A
release build should also attach an automated transitive-dependency SBOM.
