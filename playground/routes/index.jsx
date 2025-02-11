import { Counter } from "~/ui/components/counter";

export default defineEventHandler(() => {
  return renderToString(<Counter />);
});
