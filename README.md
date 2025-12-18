# Policy Transition Logic Validator (MVP)

**Deterministic Policy Status Transitions via Precision Prompt Engineering & Rigorous Validation**

---

## Overview

The **Policy Transition Logic Validator** is a Minimum Viable Product (MVP) that demonstrates how **Precision Prompt Engineering** and **automated evaluation frameworks** can be used to translate complex, high-risk insurance business logic into a **deterministic, production-ready .NET/C# microservice**.

This project directly addresses a common failure mode in AI-assisted development:  
> *non-deterministic “vibe coding” applied to compliance-critical logic.*

Instead, this MVP proves an **AI-native, governance-first delivery pipeline** where:
- business intent is explicitly encoded into machine-actionable instructions,
- generated code is continuously validated against golden scenarios and architectural rules,
- AI output is treated as **provable**, not probabilistic.

---

## Problem Statement

Policy status transitions (e.g., **Active → Suspended → Cancelled**) are:
- financially impactful,
- tightly regulated,
- highly sensitive to edge cases.

Traditional approaches fail because:
- requirements are vague or scattered across documents,
- logic is re-implemented inconsistently across services,
- AI-assisted code generation lacks guardrails and validation.

This MVP demonstrates a **repeatable, auditable alternative**.

---

## MVP Focus

### Policy Status Transition Service

A stateless microservice that evaluates policy events (payment failures, fraud flags, activation timing) and deterministically decides whether a policy’s status should transition.

**Example rule (MVP):**
> A policy transitions from **Active → Suspended** when **two consecutive monthly payments fail**, provided no higher-priority rule (e.g., fraud) applies.

---

## Core Concepts

### 1. Precision Prompt Engineering

High-level business intent is decomposed into structured **Context Packets** that include:
- explicit role and goal definition,
- authoritative rulebooks,
- strict data schemas,
- governance constraints (via RAG-injected ADRs),
- required output formats.

This prevents the LLM from:
- inventing data models,
- violating architectural decisions,
- introducing non-deterministic behavior.

---

### 2. Separation of Reasoning and Code Generation

- **Reasoning LLM (Claude)**  
  Acts as a “thinking partner” to articulate the logical flow and rule evaluation order.

- **Code Generation LLM (Cursor / Copilot)**  
  Produces .NET/C# code and xUnit tests strictly from the validated reasoning output.

This separation ensures clarity, traceability, and correctness.

---

### 3. Rigorous Validation (Proof Over Trust)

All AI-generated output is validated using an evaluation framework (LangSmith or HoneyHive):

- **Golden Scenario Dataset**
  - Canonical inputs and expected outcomes
- **Automated Logic Checks**
  - Ensures transitions only occur when rules are satisfied
- **Governance & ADR Compliance Checks**
  - Verifies logging, error handling, and architectural constraints
- **Executable Tests**
  - AI-generated xUnit tests are compiled and run automatically

Failures result in prompt tuning and re-evaluation—**not manual patching**.

---

## Architecture (MVP)

