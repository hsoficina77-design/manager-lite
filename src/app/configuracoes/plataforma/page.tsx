import { redirect } from "next/navigation";

// A antiga aba Plataforma virou o painel admin. O endereço fica para as notificações
// antigas, que apontavam para cá: a conta da plataforma cai no painel, as outras voltam
// ao início (exigirPlataforma, em /admin).
export default function PlataformaPage() {
  redirect("/admin");
}
