import { LOGO_URL } from "@/lib/constants";

type Props = {
  className?: string;
};

export function Logo({ className }: Props) {
  return (
    <img
      className={className}
      src={LOGO_URL}
      alt="Índice da Indústria Inteligente"
    />
  );
}
