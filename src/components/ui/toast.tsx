// src/components/examples/toast-examples.tsx

"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

/**
 * Componente de exemplo mostrando como usar o sistema de toast
 */
export function ToastExamples() {
  const { toast } = useToast();

  const showBasicToast = () => {
    toast("Toast básico", {
      description: "Esta é uma notificação simples",
    });
  };

  const showSuccessToast = () => {
    toast.success("Operação realizada com sucesso!", {
      description: "Seus dados foram salvos corretamente",
    });
  };

  const showErrorToast = () => {
    toast.error("Erro ao processar solicitação", {
      description: "Verifique sua conexão e tente novamente",
      action: {
        label: "Tentar novamente",
        onClick: () => console.log("Tentando novamente..."),
      },
    });
  };

  const showWarningToast = () => {
    toast.warning("Atenção!", {
      description: "Esta ação não pode ser desfeita",
      action: {
        label: "Entendi",
        onClick: () => console.log("Usuário confirmou"),
      },
    });
  };

  const showInfoToast = () => {
    toast.info("Nova atualização disponível", {
      description: "Versão 2.0 com novas funcionalidades",
      action: {
        label: "Ver novidades",
        onClick: () => console.log("Abrindo changelog..."),
      },
    });
  };

  const showLoadingToast = () => {
    const loadingId = toast.loading("Processando...", {
      description: "Aguarde enquanto processamos sua solicitação",
    });

    // Simular operação assíncrona
    setTimeout(() => {
      toast.dismiss(loadingId);
      toast.success("Processamento concluído!");
    }, 3000);
  };

  const showPromiseToast = () => {
    // Simular uma operação assíncrona
    const mockAsyncOperation = () => {
      return new Promise<{ data: string }>((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() > 0.5) {
            resolve({ data: "Dados carregados" });
          } else {
            reject(new Error("Falha na conexão"));
          }
        }, 2000);
      });
    };

    toast.promise(mockAsyncOperation(), {
      loading: "Carregando dados...",
      success: (data) => `Sucesso: ${data.data}`,
      error: (error) => `Erro: ${error.message}`,
    });
  };

  const showCustomDurationToast = () => {
    toast("Toast com duração customizada", {
      description: "Este toast ficará visível por 10 segundos",
      duration: 10000,
    });
  };

  const showToastWithAction = () => {
    toast("Arquivo removido", {
      description: "O arquivo foi movido para a lixeira",
      action: {
        label: "Desfazer",
        onClick: () => {
          toast.success("Ação desfeita!", {
            description: "O arquivo foi restaurado",
          });
        },
      },
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Sistema de Toast - Exemplos
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Toast Básico */}
        <div className="space-y-2">
          <h3 className="font-semibold">Toast Básico</h3>
          <Button onClick={showBasicToast} variant="outline" className="w-full">
            Mostrar Toast Básico
          </Button>
        </div>

        {/* Toast de Sucesso */}
        <div className="space-y-2">
          <h3 className="font-semibold">Sucesso</h3>
          <Button
            onClick={showSuccessToast}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            Toast de Sucesso
          </Button>
        </div>

        {/* Toast de Erro */}
        <div className="space-y-2">
          <h3 className="font-semibold">Erro</h3>
          <Button
            onClick={showErrorToast}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            Toast de Erro
          </Button>
        </div>

        {/* Toast de Aviso */}
        <div className="space-y-2">
          <h3 className="font-semibold">Aviso</h3>
          <Button
            onClick={showWarningToast}
            className="w-full bg-yellow-600 hover:bg-yellow-700"
          >
            Toast de Aviso
          </Button>
        </div>

        {/* Toast de Informação */}
        <div className="space-y-2">
          <h3 className="font-semibold">Informação</h3>
          <Button
            onClick={showInfoToast}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Toast de Info
          </Button>
        </div>

        {/* Toast de Loading */}
        <div className="space-y-2">
          <h3 className="font-semibold">Loading</h3>
          <Button
            onClick={showLoadingToast}
            className="w-full bg-gray-600 hover:bg-gray-700"
          >
            Toast de Loading
          </Button>
        </div>

        {/* Toast Promise */}
        <div className="space-y-2">
          <h3 className="font-semibold">Promise</h3>
          <Button
            onClick={showPromiseToast}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            Toast Promise
          </Button>
        </div>

        {/* Toast com Duração Custom */}
        <div className="space-y-2">
          <h3 className="font-semibold">Duração Customizada</h3>
          <Button
            onClick={showCustomDurationToast}
            variant="outline"
            className="w-full"
          >
            Toast 10s
          </Button>
        </div>

        {/* Toast com Ação */}
        <div className="space-y-2">
          <h3 className="font-semibold">Com Ação</h3>
          <Button
            onClick={showToastWithAction}
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            Toast com Ação
          </Button>
        </div>
      </div>

      {/* Seção de código de exemplo */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Como usar em seus componentes
        </h2>

        <div className="bg-gray-50 p-6 rounded-lg">
          <pre className="text-sm text-gray-800 overflow-x-auto">
            {`import { useToast } from '@/hooks/use-toast';

function MyComponent() {
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      // Simular operação
      await saveData();

      toast.success('Dados salvos!', {
        description: 'Suas alterações foram salvas com sucesso',
      });
    } catch (error) {
      toast.error('Erro ao salvar', {
        description: 'Tente novamente em alguns instantes',
        action: {
          label: 'Tentar novamente',
          onClick: handleSave,
        },
      });
    }
  };

  return (
    <Button onClick={handleSave}>
      Salvar
    </Button>
  );
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
