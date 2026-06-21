/** Termos de Uso (página pública). */
import { Link } from 'react-router-dom';
import { LegalLayout } from './LegalLayout';

export function Terms() {
  return (
    <LegalLayout
      title="Termos de Uso"
      subtitle="As regras para utilizar a plataforma SkillEx."
      sections={[
        {
          title: 'Aceitação dos termos',
          body: (
            <p>
              Ao criar uma conta ou utilizar a SkillEx, você declara que leu, compreendeu e concorda
              com estes Termos de Uso e com a nossa <Link to="/privacy">Política de Privacidade</Link>.
            </p>
          ),
        },
        {
          title: 'Descrição do serviço',
          body: (
            <p>
              A SkillEx é uma plataforma social que conecta pessoas para a troca de habilidades. Os
              usuários podem ensinar o que sabem e aprender o que desejam, por meio de trocas
              diretas (Skill Exchange) ou pagando aulas com a moeda interna (SkillCoins).
            </p>
          ),
        },
        {
          title: 'Cadastro e conta',
          body: (
            <p>
              Para usar a plataforma, você deve fornecer informações verdadeiras e manter seus dados
              atualizados. Você é responsável por manter a confidencialidade da sua senha e por
              todas as atividades realizadas na sua conta.
            </p>
          ),
        },
        {
          title: 'Regras de conduta',
          body: (
            <>
              <p>
                Ao utilizar a SkillEx, você concorda em <strong>não</strong>:
              </p>
              <ul>
                <li>Publicar conteúdo ofensivo, ilegal, discriminatório ou enganoso;</li>
                <li>Assediar, ameaçar ou prejudicar outros usuários;</li>
                <li>Criar perfis falsos ou se passar por outra pessoa;</li>
                <li>Utilizar a plataforma para fins fraudulentos ou não autorizados.</li>
              </ul>
            </>
          ),
        },
        {
          title: 'Trocas de habilidades e responsabilidades',
          body: (
            <p>
              A SkillEx atua como intermediadora, conectando usuários. A qualidade, a segurança e o
              cumprimento das aulas e trocas são de responsabilidade dos próprios usuários
              envolvidos. Recomendamos combinar os detalhes com clareza e avaliar cada experiência
              ao final.
            </p>
          ),
        },
        {
          title: 'Moedas internas (SkillCoins)',
          body: (
            <p>
              As SkillCoins são uma moeda virtual interna, sem valor monetário real nesta versão.
              Elas podem ser usadas para solicitar aulas quando não há uma troca direta. Ao
              solicitar uma aula paga, as moedas ficam reservadas até a confirmação da conclusão. O
              saque em dinheiro real é uma funcionalidade futura, não disponível atualmente.
            </p>
          ),
        },
        {
          title: 'Avaliações',
          body: (
            <p>
              Após uma troca ou aula concluída, os participantes podem se avaliar com nota e
              comentário. As avaliações devem ser honestas e respeitosas, e ajudam a construir a
              reputação da comunidade.
            </p>
          ),
        },
        {
          title: 'Propriedade intelectual',
          body: (
            <p>
              A marca, o design e o código da SkillEx pertencem ao projeto. O conteúdo que você
              publica (perfil, habilidades, mensagens) continua sendo seu, mas você concede à
              plataforma o direito de exibi-lo conforme necessário para o funcionamento do serviço.
            </p>
          ),
        },
        {
          title: 'Limitação de responsabilidade',
          body: (
            <p>
              A SkillEx é fornecida "como está", no contexto de um projeto acadêmico. Não garantimos
              que o serviço estará disponível de forma ininterrupta ou livre de erros, e não nos
              responsabilizamos por danos decorrentes das interações entre usuários.
            </p>
          ),
        },
        {
          title: 'Encerramento de conta',
          body: (
            <p>
              Você pode encerrar sua conta a qualquer momento. Podemos suspender ou encerrar contas
              que violem estes Termos de Uso ou prejudiquem a comunidade.
            </p>
          ),
        },
        {
          title: 'Alterações dos termos',
          body: (
            <p>
              Estes Termos podem ser atualizados periodicamente. O uso contínuo da plataforma após
              alterações representa a aceitação dos novos termos.
            </p>
          ),
        },
        {
          title: 'Contato',
          body: (
            <p>
              Dúvidas sobre estes Termos de Uso? Fale conosco pelo e-mail{' '}
              <a href="mailto:contato@skillex.com">contato@skillex.com</a>.
            </p>
          ),
        },
      ]}
    />
  );
}
