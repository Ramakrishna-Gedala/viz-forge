import logging
import os
from pathlib import Path

logger = logging.getLogger(__name__)

WINUTILS_DIR = Path(__file__).parent.parent / "winutils" / "hadoop-3.3.5"

_spark = None


def init_spark():
    """Initialize SparkSession once at startup. Returns None if setup fails."""
    global _spark
    try:
        # Set HADOOP_HOME before creating SparkSession (required on Windows)
        os.environ["HADOOP_HOME"] = str(WINUTILS_DIR)
        bin_path = str(WINUTILS_DIR / "bin")
        current_path = os.environ.get("PATH", "")
        if bin_path not in current_path:
            os.environ["PATH"] = bin_path + os.pathsep + current_path

        # Spark temp dir to avoid Windows ACL issues with %TEMP%
        spark_tmp = Path("C:/tmp/spark")
        spark_tmp.mkdir(parents=True, exist_ok=True)

        from pyspark.sql import SparkSession

        _spark = (
            SparkSession.builder
            .master("local[2]")
            .appName("DataToolsPlatform")
            .config("spark.sql.shuffle.partitions", "4")
            .config("spark.driver.memory", "1g")
            .config("spark.ui.enabled", "false")
            .config("spark.log.level", "ERROR")
            .config("spark.local.dir", "C:/tmp/spark")
            .config("spark.sql.execution.arrow.pyspark.enabled", "true")
            .config("spark.sql.adaptive.enabled", "true")
            .getOrCreate()
        )
        _spark.sparkContext.setLogLevel("ERROR")
        logger.info("SparkSession initialized successfully")
        return _spark
    except Exception as e:
        logger.error(f"SparkSession init failed: {e}")
        logger.warning("Spark endpoints will return 503. Download winutils from github.com/cdarlint/winutils")
        return None


def get_spark():
    """Return the active SparkSession or raise RuntimeError."""
    if _spark is None:
        raise RuntimeError("SparkSession not available. Check HADOOP_HOME/winutils setup.")
    return _spark
