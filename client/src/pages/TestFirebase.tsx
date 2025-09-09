import { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

export default function TestFirebase() {
  const [hinos, setHinos] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const querySnapshot = await getDocs(collection(db, "hinos"));
      const dados = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setHinos(dados);
    };

    fetchData();
  }, []);

  return (
    <div>
      <h1>Lista de Hinos</h1>
      <ul>
        {hinos.map((hino) => (
          <li key={hino.id}>
            <strong>{hino.numero}. {hino.titulo}</strong><br />
            Órgão: {hino.orgao} <br />
            <button>Tocar</button>
            <hr />
          </li>
        ))}
      </ul>
    </div>
  );
}
