# Developer Studio Release Status

ECHO Developer Studio is the authoring and tooling surface for ECHO projects. It is not the ECHO Native Platform runtime release.

Native SDK features in Studio must follow the public `1.0.0-RC1` addon workflow: generate from the canonical Native template, compile against public SDK artifacts, package `.echo-addon`, validate with testkit, and load in Native release mode without loader internals or dev classpath fallback.

Public Studio release assets are staged through GitHub releases and the ECHO website after their own release gates pass.
