import { Component } from 'react';
import { AlertTriangle, RotateCw, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';

// Catches render errors in any page so a single broken screen never white-outs
// the whole app. Shows a friendly recovery card with the actual error.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Keep a copy for debugging in the console.
    console.warn('[Life OS] Erro capturado pelo ErrorBoundary:', error, info);
  }

  handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  handleReset = () => {
    if (window.confirm('Isto vai restaurar os dados de exemplo e apagar o que você cadastrou neste navegador. Continuar?')) {
      try {
        useStore.getState().resetAll();
      } catch {
        localStorage.removeItem('life-os-store');
      }
      window.location.reload();
    }
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="max-w-lg mx-auto mt-10">
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={20} className="text-danger" />
            <h1 className="font-heading font-bold text-xl">Algo quebrou nesta tela</h1>
          </div>
          <p className="text-sm text-ink-dim mb-4">
            Não se preocupe — seus dados continuam salvos. Isso costuma acontecer depois de uma
            atualização com a aba aberta. Recarregar a página resolve na maioria das vezes.
          </p>

          <pre className="text-[0.7rem] font-mono bg-washi-soft border border-line rounded-sharp p-3 mb-4 overflow-x-auto text-danger whitespace-pre-wrap">
            {String(this.state.error?.message || this.state.error)}
          </pre>

          <div className="flex flex-wrap gap-2">
            <button className="btn-primary" onClick={this.handleReload}>
              <RotateCw size={14} /> Recarregar página
            </button>
            <button className="btn-ghost !border-danger !text-danger hover:!bg-danger/5" onClick={this.handleReset}>
              <Trash2 size={14} /> Restaurar dados de exemplo
            </button>
          </div>
          <p className="text-[0.68rem] text-ink-dim mt-3">
            Se o erro persistir, me mande o texto em vermelho acima — ele diz exatamente o que falhou.
          </p>
        </div>
      </div>
    );
  }
}
