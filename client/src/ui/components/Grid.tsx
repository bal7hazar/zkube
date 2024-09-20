import React, { useCallback, useEffect, useState } from "react";
import "../../grid.css";
import { Account } from "starknet";
import { useDojo } from "@/dojo/useDojo";
import useAccountCustom from "@/hooks/useAccountCustom";

interface Block {
  id: number;
  x: number;
  y: number;
  width: number;
}

interface GridProps {
  initialData: Block[];
}

const transformToGridFormat = (
  blocks: Block[],
  gridWidth: number,
  gridHeight: number,
): number[][] => {
  // Créer une grille vide avec des zéros
  const grid = Array.from({ length: gridHeight }, () =>
    Array(gridWidth).fill(0),
  );

  // Remplir la grille avec les ID des blocs
  blocks.forEach((block) => {
    for (let i = 0; i < block.width; i++) {
      grid[block.y][block.x + i] = block.id;
    }
  });

  return grid;
};

const removeCompleteRows = (
  blocks: Block[],
  gridWidth: number,
  gridHeight: number,
) => {
  // Créer une grille vide pour vérifier les lignes complètes
  const grid = transformToGridFormat(blocks, gridWidth, gridHeight);

  // Trouver les lignes complètes
  const completeRows = grid
    .map((row, index) => (row.every((cell) => cell !== 0) ? index : -1))
    .filter((index) => index !== -1);

  // Retirer les blocs de toutes les lignes complètes
  const updatedBlocks = blocks.filter((block) => {
    // Retirer les blocs qui sont entièrement sur une ligne complète
    const isBlockOnCompleteRow = completeRows.some((rowIndex) => {
      return block.y === rowIndex;
    });
    return !isBlockOnCompleteRow;
  });

  return updatedBlocks;
};

const Grid: React.FC<GridProps> = ({ initialData }) => {
  const {
    setup: {
      systemCalls: { move },
    },
  } = useDojo();
  const { account } = useAccountCustom();
  const [blocks, setBlocks] = useState<Block[]>(initialData);
  const [dragging, setDragging] = useState<Block | null>(null); // Le bloc actuellement déplacé
  const [isDragging, setIsDragging] = useState(false); // Indique si un bloc est en cours de déplacement
  const [dragStartX, setDragStartX] = useState(0); // Position de départ de la souris
  const [initialX, setInitialX] = useState(0); // Position initiale du bloc
  const [blocksStable, setBlocksStable] = useState(true); // Indicateur de stabilité des blocs
  const [isMoving, setIsMoving] = useState(true); // Indicateur de mouvement des blocs
  const [pendingMove, setPendingMove] = useState<{
    rowIndex: number;
    startX: number;
    finalX: number;
  } | null>(null);

  const gridSize = 40; // Taille d'une cellule de la grille (40px)
  const gridWidth = 8; // Nombre de colonnes
  const gridHeight = 10; // Nombre de lignes
  const gravitySpeed = 100; // Intervalle de temps pour l'animation de chute (en ms)

  const handleDragMove = (x: number) => {
    if (!dragging) return; // Si aucun bloc n'est en train d'être déplacé

    const deltaX = x - dragStartX; // Distance parcourue par la souris
    const newX = initialX + deltaX / gridSize; // Conversion de la distance en déplacement de colonnes

    // Limiter la position du bloc à l'intérieur des limites de la grille (colonne 0 à 7)
    const boundedX = Math.max(0, Math.min(gridWidth - dragging.width, newX));

    // Vérifier s'il y a des blocs dans le chemin
    if (
      !isBlocked(
        initialX,
        boundedX,
        dragging.y,
        dragging.width,
        blocks,
        dragging.id,
      )
    ) {
      setBlocks((prevBlocks) =>
        prevBlocks.map((b) =>
          b.id === dragging.id ? { ...b, x: boundedX } : b,
        ),
      );
    }
  };

  // Fonction pour gérer le début du drag (souris ou touche)
  const handleDragStart = (x: number, block: Block) => {
    setDragging(block); // On stocke le bloc en cours de déplacement
    setIsDragging(true); // Indique que le bloc est en train d'être déplacé
    setDragStartX(x); // Position de départ de la souris
    setInitialX(block.x); // Position initiale du bloc dans la grille
  };

  const handleMouseDown = (e: React.MouseEvent, block: Block) => {
    e.preventDefault();
    handleDragStart(e.clientX, block);
  };

  // Gestion du TouchStart (pour mobile)
  const handleTouchStart = (e: React.TouchEvent, block: Block) => {
    const touch = e.touches[0]; // Récupère la position du premier doigt
    handleDragStart(touch.clientX, block);
  };

  // Gestion du MouseMove (pour souris)
  const handleMouseMove = (e: React.MouseEvent) => {
    handleDragMove(e.clientX);
  };
  // Gestion du TouchMove (pour mobile)
  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleDragMove(touch.clientX);
  };

  // Fonction pour finir le drag
  const endDrag = () => {
    if (!dragging) return;
    // Clamper la position du bloc à la grille la plus proche

    setBlocks((prevBlocks) => {
      const updatedBlocks = prevBlocks.map((b) => {
        if (b.id === dragging.id) {
          const finalX = Math.round(b.x); // Arrondir à la grille
          // Appeler handleMove avec les coordonnées actuelles après la mise à jour
          handleMove(b.y, initialX, finalX);
          return { ...b, x: finalX }; // Mettre à jour la position du bloc
        }
        return b;
      });

      // On ne change pas encore l'état des blocs pour la suppression des lignes
      return updatedBlocks;
    });
    setIsDragging(false);
    setDragging(null);
  };

  // Gestion du MouseUp (fin du drag pour souris)
  const handleMouseUp = () => {
    endDrag();
  };

  // Gestion du TouchEnd (fin du drag pour mobile)
  const handleTouchEnd = () => {
    endDrag();
  };

  const handleMove = useCallback(
    async (rowIndex: number, startColIndex: number, finalColIndex: number) => {
      if (startColIndex === finalColIndex) return; // Ne pas envoyer si aucune modification
      if (!account) return;

      try {
        await move({
          account: account as Account,
          row_index: rowIndex,
          start_index: startColIndex,
          final_index: finalColIndex,
        });
        console.log(
          `Mouvement effectué : Ligne ${rowIndex}, de ${startColIndex} à ${finalColIndex}`,
        );
      } catch (error) {
        console.error("Erreur lors de l'envoi de la transaction", error);
      }
    },
    [account, move],
  );

  // Vérifie s'il y a un bloc qui bloque le chemin
  const isBlocked = (
    initialX: number,
    newX: number,
    y: number,
    width: number,
    blocks: Block[],
    blockId: number,
  ) => {
    const rowBlocks = blocks.filter(
      (block) => block.y === y && block.id !== blockId,
    );

    // Déterminer si le déplacement est vers la droite ou la gauche
    if (newX > initialX) {
      // Mouvement vers la droite : vérifier les blocs entre initialX et newX
      for (const block of rowBlocks) {
        if (block.x >= initialX + width && block.x < newX + width) {
          // Bloc trouvé dans le chemin à droite
          return true;
        }
      }
    } else {
      // Mouvement vers la gauche : vérifier les blocs entre initialX et newX
      for (const block of rowBlocks) {
        if (block.x + block.width > newX && block.x <= initialX) {
          // Bloc trouvé dans le chemin à gauche
          return true;
        }
      }
    }

    return false; // Pas de bloc bloquant
  };

  // Calculer la distance maximale que le bloc peut descendre
  const calculateFallDistance = (block: Block, blocks: Block[]) => {
    let maxFall = gridHeight - block.y - 1; // Limite par rapport au bas de la grille
    for (let y = block.y + 1; y < gridHeight; y++) {
      if (isCollision(block.x, y, block.width, blocks, block.id)) {
        maxFall = y - block.y - 1;
        break;
      }
    }
    return maxFall;
  };

  // Vérifier s'il y a collision avec un autre bloc
  const isCollision = (
    x: number,
    y: number,
    width: number,
    blocks: Block[],
    blockId: number,
  ) => {
    return blocks.some(
      (block) =>
        block.id !== blockId &&
        block.y === y &&
        x < block.x + block.width &&
        x + width > block.x,
    );
  };

  // Appliquer la gravité
  const applyGravity = () => {
    setBlocks((prevBlocks) => {
      const newBlocks = prevBlocks.map((block) => {
        const fallDistance = calculateFallDistance(block, prevBlocks);
        if (fallDistance > 0) {
          return { ...block, y: block.y + 1 }; // Descendre d'une ligne
        }
        return block; // Rester en place si aucune descente possible
      });

      // Comparer les blocs avant et après application de la gravité
      const blocksChanged = !prevBlocks.every((block, index) => {
        const newBlock = newBlocks.find((b) => b.id === block.id);
        return newBlock && block.x === newBlock.x && block.y === newBlock.y;
      });

      // Mettre à jour l'indicateur de mouvement
      setIsMoving(blocksChanged);

      return newBlocks;
    });
  };

  // Lancer la gravité à un intervalle donné
  useEffect(() => {
    if (isDragging) return; // Ne pas appliquer la gravité si un bloc est en cours de déplacement

    const interval = setInterval(() => {
      applyGravity();
    }, gravitySpeed);

    return () => clearInterval(interval); // Nettoyer l'intervalle
  }, [isDragging]); // Dépendance ajoutée pour réagir aux changements de isDragging

  // Supprimer les lignes complètes lorsque les blocs sont stables
  useEffect(() => {
    if (blocksStable && !isMoving) {
      setBlocks((prevBlocks) => {
        const cleanedBlocks = removeCompleteRows(
          prevBlocks,
          gridWidth,
          gridHeight,
        );
        return cleanedBlocks;
      });
    }
  }, [blocksStable, isMoving]);

  // Mettre à jour l'état de stabilité des blocs
  useEffect(() => {
    if (!isMoving) {
      setBlocksStable(true);
    } else {
      setBlocksStable(false);
    }
    console.log(transformToGridFormat(blocks, gridWidth, gridHeight));
  }, [isMoving]);

  // Effet pour appeler handleMove lorsque les blocs deviennent stables
  useEffect(() => {
    if (!isMoving && pendingMove) {
      // Si les blocs sont stables et qu'il y a un mouvement en attente
      const { rowIndex, startX, finalX } = pendingMove;
      handleMove(rowIndex, startX, finalX); // Appeler handleMove avec les bonnes positions
      setPendingMove(null); // Réinitialiser pendingMove après l'appel
    }
  }, [isMoving, pendingMove, handleMove]);

  return (
    <div className="grid-background">
      <div
        className="grid-container"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {blocks.map((block) => (
          <div
            key={block.id}
            className={`block block-${block.width}`}
            style={{
              position: "absolute",
              top: `${block.y * gridSize + 1}px`, // Position Y (ligne)
              left: `${block.x * gridSize + 1}px`, // Position X (colonne)
              width: `${block.width * gridSize}px`, // Largeur en fonction du nombre de colonnes
              height: `${gridSize}px`, // Hauteur d'une ligne
              transition: "top 0.1s linear",
              color: "white",
            }}
            onMouseDown={(e) => handleMouseDown(e, block)} // Début du drag pour souris
            onTouchStart={(e) => handleTouchStart(e, block)} // Début du drag pour mobile
          >
            Block {block.id}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Grid;