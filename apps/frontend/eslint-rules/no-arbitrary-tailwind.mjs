/**
 * ESLint rule: no-arbitrary-tailwind
 *
 * Flags Tailwind arbitrary values `[value]` in className attributes.
 * Provides a warning directing developers to the audit script and allowlist.
 *
 * Run `npm run lint:design` for the comprehensive audit, or
 * `npm run lint:design:json` for CI-friendly JSON output.
 */

const ARBITRARY_VALUE_REGEX = /\[([^\]]+)\]/g;

/** Known false positives — JS expressions, CSS selectors, etc. */
const JS_IDENTIFIER = /^[a-zA-Z_$][a-zA-Z0-9_$.()\[\]\-]*$/;
const CSS_SELECTOR = /=/;
const BARE_NUMBER = /^\d+(\.\d+)?$/;
const CSS_COMPLEX = /[:,\s]|gradient|rgba\(|rgb\(|var\(/;
const HEX_COLOR = /^#[0-9a-fA-F]{3,8}$/;
const RGBA_FN = /^rgba?\(/;
const VAR_FN = /^var\(/;

function isFalsePositive(value) {
  return JS_IDENTIFIER.test(value) ||
         CSS_SELECTOR.test(value) ||
         BARE_NUMBER.test(value) ||
         CSS_COMPLEX.test(value) ||
         HEX_COLOR.test(value) ||
         RGBA_FN.test(value) ||
         VAR_FN.test(value);
}

/** @type {import('eslint').Rule.RuleModule} */
export const noArbitraryTailwind = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Flag Tailwind arbitrary values in className. Use DESIGN.md tokens instead.',
    },
    messages: {
      arbitraryValue: 'Arbitrary Tailwind value "[{{ value }}]" — replace with a DESIGN.md token or add to scripts/tailwind-allowlist.json. Run `npm run lint:design` for full audit.',
    },
    schema: [],
  },

  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.name !== 'className') return;

        let raw = null;
        if (node.value?.type === 'Literal' && typeof node.value.value === 'string') {
          raw = node.value.value;
        } else if (node.value?.type === 'TemplateLiteral') {
          // Only check quasis (static parts), not expressions
          raw = node.value.quasis.map((q) => q.value.raw).join(' ');
        }

        if (!raw) return;

        let match;
        while ((match = ARBITRARY_VALUE_REGEX.exec(raw)) !== null) {
          const value = match[1].trim();
          if (!isFalsePositive(value)) {
            context.report({
              node,
              messageId: 'arbitraryValue',
              data: { value },
            });
          }
        }
      },
    };
  },
};
