import { Discovery } from "@/components/discovery";
import { assertValidContent } from "@/content/validate";
import { assertValidOscaDataset } from "@/lib/osca/validate";

// Build-time validation: this server module is evaluated while the static
// export is generated, so invalid content or OSCA data fails `next build`.
assertValidContent();
assertValidOscaDataset();

export default function Page() {
  return <Discovery />;
}
